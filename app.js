if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const exphbs = require('express-handlebars')

const routes = require('./routes') // 預設會找底下 index.js
const app = express()
const PORT = process.env.PORT || 3000

// set view engine
app.engine('handlebars', exphbs({ defaultLayout: 'main', helpers: exphbs }))
app.set('view engine', 'handlebars')

// 所有路由都會先經過 app.use
app.use(express.static('public'))
app.use(routes)

// 監聽函式
app.listen(PORT, () => console.log(`http://localhost:${PORT}`))


module.exports = app