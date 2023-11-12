const router = require('express').Router()

const admin = require('./modules/admin')
const auth = require('./modules/auth')
const classes = require('./modules/classes')
const enrollments = require('./modules/enrollments')
const users = require('./modules/users')


// router.use('/admin', admin)
// router.use('/auth', auth)
// router.use('/classes', classes)
// router.use('/enrollments', enrollments)
router.use('/users', users)


router.get('/', (req, res) => res.send('This is home page.'))

module.exports = router