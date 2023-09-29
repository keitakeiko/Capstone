const express = require('express')
const router = express.Router()

const admin = require('./modules/admin')
const users = require('./modules/users')
const passport = require('../config/passport')

const { generalErrorHandler } = require('../middleware/error-handler')
const { userController } = require('../controllers/user-controller')
const { authenticated, authenticatedRole, authenticatedAdmin } = require('../middleware/auth')

router.get('/signup', userController.getSignUpPage)
router.post('/signup', userController.postSignUp)
router.get('/signin', userController.getSignInPage)
router.post('/signin', passport.authenticate('local', {failureRedirect: '/signin', failureFlash: true }), userController.postSignIn)

router.use('/users', authenticated, authenticatedRole, users)
router.use('/admin', authenticatedAdmin, admin)
router.use('/', userController.getHomeTeachers)
router.use('/', generalErrorHandler)

module.exports = router