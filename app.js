if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const exphbs = require('express-handlebars')
const flash = require('connect-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const passport = require('./config/passport')
const hbsHelper = require('./helpers/handlebars-helpers')
const routes = require('./routes') // 預設會找底下 index.js
const app = express() 
const path = require('path') // 引入 path 套件

const PORT = process.env.PORT || 3000
const SESSION_SECRET = 'whisper crag'
const { getUser } = require('./helpers/auth-helpers')

// set view engine
app.engine('handlebars', exphbs({ defaultLayout: 'main', helpers: hbsHelper }))
app.set('view engine', 'handlebars')

// 所有路由都會先經過 app.use

app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use('/upload', express.static(path.join(__dirname, 'upload'))) 
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.user = getUser(req)
  next()
})
app.use(routes)

// 監聽函式
app.listen(PORT, () => console.log(`http://localhost:${PORT}`))


module.exports = app