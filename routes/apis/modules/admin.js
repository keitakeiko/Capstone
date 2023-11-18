const router = require('express').Router()
const adminController = require('../../../controllers/apis/admin-controller')
const passport = require('../../../config/passport')

router.post(
  '/signin',
  passport.authenticate('local', { session: true }),
  adminController.signIn
)
router.get('/users', adminController.getUsers)

module.exports = router
