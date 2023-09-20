const express = require('express')
const router = express.Router()

// const admin = require('./modules/admin')
const users = require('./modules/users')
const home = require('./modules/home')

router.use('/users', users)
// router.use('/admin', admin)
router.use('/', home)

module.exports = router