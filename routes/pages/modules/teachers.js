const express = require('express')
const router = express.Router()
const upload = require('../../../middleware/multer')
const userController = require('../../../controllers/pages/user-controller')

router.get('/:id/checkTeacherPage', userController.getCheckTeacherPage)
router.post('/:id/checkTeacherPage', userController.reserveClass)
router.get('/:id/editTeacherPage', userController.getTeacherEditPage)
router.put('/:id/editTeacherPage', userController.putTeacherEditPage)
router.get('/:id', userController.getTeacherPage)


module.exports = router