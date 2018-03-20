async function handler(req, res, next) {
  const {Queues} = req.app.locals;
  const queues = await Queues.richList()
  return res.render('dashboard/templates/queueList', { queues });
}

module.exports = handler;
