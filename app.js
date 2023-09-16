const express = require('express')
const app = express()
const exphbs = require('express-handlebars')

const PORT = 3000

// set view engine
app.engine('handlebars', exphbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

// 所有路由都會先經過 app.use
app.use(express.static('public'))


app.get('/', (req, res) => {
  res.render('layouts/main')
})


// 監聽函式
app.listen(PORT, () => console.log(`http://localhost:${PORT}`))