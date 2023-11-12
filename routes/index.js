const router = require('express').Router()
const pages = require('./pages')
const apis = require('./apis')

router.use('/api/v1', apis)
router.use('/', pages)


module.exports = router