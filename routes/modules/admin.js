const express = require('express')
const router = express.Router()

// const adminController = require('../../controllers/admin-controller')
const {adminGetUsers} = require('../../controllers/admin-controller') 

router.get('/', adminGetUsers)

module.exports = router