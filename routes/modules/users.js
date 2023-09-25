const express = require('express')
const router = express.Router()
const { userController } = require('../../controllers/user-controller')

router.get('/:id/inspectTeacherPage', userController.getTeacherPage)
router.get('/:id/class', userController.getUserClassPage)
router.get('/:id', userController.getUserPage)


module.exports = router