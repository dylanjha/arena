const _ = require('lodash');
const Bull = require('bull');
const Bee = require('bee-queue');
const path = require('path');

class Queues {
  constructor(config) {
    this._queues = {};

    this.setConfig(config);
  }

  list() {
    return this._config.queues;
  }

  async richList () {
    return Promise.all(
      this._config.queues.map(async (config) => {
        const queue = await this.get(config.name, config.hostId)
        let jobCounts;
        if (queue.IS_BEE) {
          jobCounts = await queue.checkHealth();
          delete jobCounts.newestJob;
        } else {
          jobCounts = await queue.getJobCounts();
        }
        return {
          hostId: config.hostId,
          name: queue.name,
          jobCounts
        }
      })
    )
  }

  setConfig(config) {
    this._config = config;
  }

  async get(queueName, queueHost) {
    const queueConfig = _.find(this._config.queues, {
      name: queueName,
      hostId: queueHost
    });
    if (!queueConfig) return null;

    if (this._queues[queueHost] && this._queues[queueHost][queueName]) {
      return this._queues[queueHost][queueName];
    }

    const { type, name, port, host, db, password, prefix, url, redis } = queueConfig;

    const redisHost = { host };
    if (password) redisHost.password = password;
    if (port) redisHost.port = port;
    if (db) redisHost.db = db;

    const isBee = type === 'bee';

    const options = {
      redis: redis || url || redisHost
    };
    if (prefix) options.prefix = prefix;

    let queue;
    if (isBee) {
      _.extend(options, {
        isWorker: false,
        getEvents: false,
        sendEvents: false,
        storeJobs: false
      });

      queue = new Bee(name, options);
      queue.IS_BEE = true;
    } else {
      queue = new Bull(name, options);
    }

    this._queues[queueHost] = this._queues[queueHost] || {};
    this._queues[queueHost][queueName] = queue;

    return queue;
  }
}

module.exports = Queues;
