const express = require('express')
const router = express.Router()
const upload = require('../../middleware/multer')
const userController = require('../../controllers/user-controller')

router.get('/:id/checkTeacherPage', userController.getCheckTeacherPage)
router.get('/:id/editTeacherPage', userController.getTeacherEditPage)
router.post('/:id/editTeacherPage', userController.postTeacherEditPage)
router.get('/:id', userController.getTeacherPage)


module.exports = router