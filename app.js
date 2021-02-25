// Imports and requires
const express = require('express')
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const Airtable = require('airtable');
require("dotenv").config();

const app = express()


// Express options
app.use(express.static(`public`))
app.use(bodyParser.urlencoded({ extended: true }));
// app.enable('view cache');

// Handlebars options
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: `views/layouts/`
}))
app.set('view engine', 'hbs')
app.set('views', `views`)

// Airtable API Key
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const base = new Airtable({apiKey: AIRTABLE_API_KEY}).base('app8wtFgcpJCtRHVC');

// Webserver port
const port = process.env.PORT || 3000



// Express routings
app.get('/', (req, res) => {
  res.render('index', { layout: 'main' });
});

app.post('/', (req, res) => {
  const card_id = req.body.cardID
  const checkInDateTime = new Date()
  base('SAC Time Sheet').create([
    {
      "fields": {
        "Card ID":card_id,
        "SAC Name": "Tony",
        "Admin Number": "201560E",
        "Check In Date-Time": checkInDateTime
      }
    },
  ], function(err) {
    if (err) {
      console.error(err);
      return;
    }
  });
  res.render('index',{
    'statusSuccessIn': true
  })
})

// Initialise webserver
app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})