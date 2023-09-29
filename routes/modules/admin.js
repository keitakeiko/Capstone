const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin-controller')


router.delete('/users/:id', adminController.deleteUsers)
router.get('/', adminController.adminGetUsers)


module.exports = router