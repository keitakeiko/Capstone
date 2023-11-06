const express = require('express')
const router = express.Router()
const upload = require('../../middleware/multer')
const userController = require('../../controllers/user-controller')


router.get('/:id/edit', userController.getUserEditPage)
router.put('/:id', upload.single('avatar'), userController.putUserPage)
router.get('/:id/applyTeacher', userController.getApplyTeacherPage)
router.post('/:id/applyTeacher', userController.postApplyTeacherPage)
// router.get('/:id/class', userController.getReserveClassPage)

// router.delete('/:id/class', userController.deleteReserveClass)
router.get('/:id/comments', userController.getCommentPage)
router.get('/:id', userController.getUserPage)


module.exports = router