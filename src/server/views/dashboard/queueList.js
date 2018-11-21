async function handler(req, res, next) {
  const {Queues} = req.app.locals;
  const queues = await Queues.richList();
  const basePath = req.baseUrl;

  return res.render('dashboard/templates/queueList', { basePath, queues });
}

module.exports = handler;
