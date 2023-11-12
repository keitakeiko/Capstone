const router = require('express').Router()
const userController = require('../../../controllers/apis/user-controller')
const passport = require('../../../config/passport')

const { generalErrorHandler } = require('../../../middleware/error-handler')
const {
  authenticated,
  authenticatedAdmin,
  authenticatedStudent } = require('../../../middleware/auth')
const upload = require('../../../middleware/multer')



router.post('/signup', upload.single('avatar'), userController.signUp)
// router.post('/signin', passport.authenticate('local', { session: true }, userController.postSignIn))

// router.get('/logout', userController.logout)

// router.get('/search', authenticated, userController.getHomeTeachers)
// router.get('/', userController.getHomeTeachers)
router.use('/', generalErrorHandler)

module.exports = router