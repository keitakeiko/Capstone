const { ensureAuthenticated, getUser } = require('../helpers/auth-helpers')

const authenticated = (req, res, next) => {
  // if (req.isAuthenticated)
  if (ensureAuthenticated(req)) {
    return next()
  }
  res.redirect('/signin')
}

const authenticatedAdmin = (req, res, next) => {
  // if (req.isAuthenticated)
  if (ensureAuthenticated(req)) {
    if (getUser(req).role === 'admin') return next()
    return res.redirect('/')
  } else {
    res.redirect('/signin')
  }
}

const authenticatedTeacher = (req, res, next) => {
  // if (req.isAuthenticated)
  if (ensureAuthenticated(req)) {
    if (getUser(req).role === 'teacher' ) return next()
  }
}

module.exports = {
  authenticated,
  authenticatedAdmin,
  authenticatedTeacher
}