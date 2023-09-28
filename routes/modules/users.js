const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const { userController } = require('../../controllers/user-controller')

router.get('/signup', userController.getSignUpPage)
router.post('/signup', userController.postSignUp)
router.get('/signin', userController.getSignInPage)
router.post('/signin', passport,authenticate('local', {failureRedirect: '/users/signin', failureFlash: true }), userController.postSignIn)

router.get('/:id/edit', userController.getUserEditPage)
router.get('/:id/checkTeacherPage', userController.getCheckTeacherPage)
router.get('/:id/applyTeacher', userController.getApplyTeacherPage)
router.get('/:id/editTeacherPage', userController.getTeacherEditPage)
router.get('/:id/class', userController.getReserveClassPage)
router.get('/:id/comments', userController.getCommentPage)
router.get('/:id', userController.getUserPage)


module.exports = router