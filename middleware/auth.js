const { getUser } = require('../helpers/auth-helpers')

// passport 來的
const ensureAuthenticated = req => {
  return req.isAuthenticated()
}

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
    req.flash('error_messages', '管理員身分才能執行操作')
    return res.redirect('/')
  } else {
    res.redirect('/signin')
  }
}

const authenticatedStudent = (req, res, next) => {
  if (ensureAuthenticated(req)) {
    if (getUser(req).role === 'user') return next()
    req.flash('error_messages', '學生身分才能執行操作')
    res.redirect('/')
  }

}


module.exports = {
  ensureAuthenticated,
  authenticated,
  authenticatedAdmin,
  authenticatedStudent
}