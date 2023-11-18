const router = require('express').Router()
const enrollmentController = require('../../../controllers/apis/enrollment-controller')

router.get('/upcoming', enrollmentController.getFutureClass)
router.get('/past', enrollmentController.pastClass)
router.post('/', enrollmentController.postClass)

module.exports = router