const { getUser } = require('../helpers/auth-helpers')

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

// passport 來的
const ensureAuthenticated = req => {
  return req.isAuthenticated()
}

const authenticatedStudent = (req, res, next) => {
  const user = getUser(req)
  if (user?.role === 'student') return next()
  req.flash('error_messages', '學生身分才能執行操作')
  res.redirect('/')
}


module.exports = {
  authenticated,
  authenticatedAdmin,
  ensureAuthenticated,
  authenticatedStudent
}