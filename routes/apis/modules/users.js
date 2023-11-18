const router = require('express').Router()
const userController = require('../../../controllers/apis/user-controller')
const passport = require('../../../config/passport')

const { generalErrorHandler } = require('../../../middleware/error-handler')
const {
  authenticated } = require('../../../middleware/api-auth')
const upload = require('../../../middleware/multer')


router.post('/signup', upload.single('avatar'), userController.signUp)
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

router.get('/logout', authenticated, userController.logout)
router.get('/ranking', authenticated, userController.getTopStudents)
router.get('/:id', authenticated, userController.userPage)
router.use('/', generalErrorHandler)

module.exports = router