// Imports and requires
const express = require('express')
const app = express()
const exphbs  = require('express-handlebars');

// Express options
app.use(express.static(`public`))
// app.enable('view cache');

// Handlebars options
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: `views/layouts/`
}))
app.set('view engine', 'hbs')
app.set('views', `views`)

// Webserver port
const port = 3000

// Express routings
app.get('/', (req, res, next) => {
  res.render('index', { layout: 'main' });
});

// Initialise webserver
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})