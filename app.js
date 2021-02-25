const express = require('express')
require("dotenv").config();

const app = express()
const port = process.env.PORT || 3000
var path = require('path');
const bodyParser = require('body-parser');
const Airtable = require('airtable');


// API Key
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY

var base = new Airtable({apiKey: AIRTABLE_API_KEY}).base('app8wtFgcpJCtRHVC');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname + '/public/static/templates/index.html'));
})

app.post('/', (req, res) => {
  const card_id = req.body.card_id
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
  ], function(err, records) {
    if (err) {
      console.error(err);
      return;
    }
  });
  res.redirect('/')
})

app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})