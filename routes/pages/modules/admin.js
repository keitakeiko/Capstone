const express = require('express')
const router = express.Router()

const adminController = require('../../../controllers/pages/admin-controller')

router.delete('/users/:id', adminController.deleteUsers)
router.get('/', adminController.adminGetUsers)


module.exports = router