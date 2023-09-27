if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const exphbs = require('express-handlebars')
const flash = require('connect-flash')
const session = require('express-session')
const hbsHelper = require('./helpers/handlebars-helpers')
const routes = require('./routes') // 預設會找底下 index.js
const app = express()
const PORT = process.env.PORT || 3000
const SESSION_SECRET = 'whisper crag'

// set view engine
app.engine('handlebars', exphbs({ defaultLayout: 'main', helpers: hbsHelper }))
app.set('view engine', 'handlebars')

// 所有路由都會先經過 app.use
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: SESSION_SECRET, reserve: false, saveUninitialized: false }))
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  next()
})
app.use(routes)

// 監聽函式
app.listen(PORT, () => console.log(`http://localhost:${PORT}`))


module.exports = app