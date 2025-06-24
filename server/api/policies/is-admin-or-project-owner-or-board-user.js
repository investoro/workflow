module.exports = async function (req, res, proceed) {
  if (req.currentUser && ['admin', 'projectOwner', 'boardUser'].includes(req.currentUser.role)) {
    return proceed();
  }
  return res.forbidden('You must be admin, project owner or board user.');
};
