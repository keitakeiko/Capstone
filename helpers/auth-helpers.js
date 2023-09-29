const getUser = req => {
  return req.user || null
}

// passport 來的
const ensureAuthenticated = req => {
  return req.isAuthenticated()
}

module.exports = {
  getUser,
  ensureAuthenticated
}