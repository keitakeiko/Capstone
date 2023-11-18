const router = require('express').Router()
const classController = require('../../../controllers/apis/class-controller')

router.get('/search', classController.getClasses)
router.get('/:id', classController.getClass)
router.post('/', classController.applyClass)
router.get('/', classController.getClasses)


module.exports = router