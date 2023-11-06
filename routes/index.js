const express = require('express')
const router = express.Router()

const teachers = require('./modules/teachers')
const admin = require('./modules/admin')
const users = require('./modules/users')
const passport = require('../config/passport')
const auth = require('./modules/auth')

const { generalErrorHandler } = require('../middleware/error-handler')
const userController = require('../controllers/user-controller')
const {
  authenticated,
  authenticatedAdmin,
  authenticatedStudent } = require('../middleware/auth')
const upload = require('../middleware/multer')


router.get('/signup', upload.single('avatar'), userController.getSignUpPage)
router.post('/signup', upload.single('avatar'), userController.postSignUp)
router.get('/signin', userController.getSignInPage)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.postSignIn)

router.use('/teachers', authenticated, teachers)
router.use('/users', authenticatedStudent, authenticated, users)
router.use('/admin', authenticatedAdmin, admin)
router.use('/auth', auth)
router.get('/', userController.getHomeTeachers)
router.use('/', authenticated, generalErrorHandler)

module.exports = router