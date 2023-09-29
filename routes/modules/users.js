const express = require('express')
const router = express.Router()

const { userController } = require('../../controllers/user-controller')


router.get('/:id/edit', userController.getUserEditPage)
router.get('/:id/checkTeacherPage', userController.getCheckTeacherPage)
router.get('/:id/applyTeacher', userController.getApplyTeacherPage)
router.get('/:id/editTeacherPage', userController.getTeacherEditPage)
router.get('/:id/class', userController.getReserveClassPage)
router.get('/:id/comments', userController.getCommentPage)
router.get('/:id', userController.getUserPage)


module.exports = router