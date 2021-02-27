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

// Airtable Base ID
const baseId = process.env.AIRTABLE_BASE_ID || 'app8wtFgcpJCtRHVC'

const base = new Airtable({apiKey: AIRTABLE_API_KEY}).base(baseId);

// Webserver port
const port = process.env.PORT || 3000


// Retrieve all SAC Info from SAC Information and store in array
const sacInfo = (callback) => {
/**
 * Retrieve all SAC Info from SAC Information and store in array
 * @param {Function} callback - Validation Function
 */
  sacInfoObj = {}
  base('SAC Information').select({
    // Selecting the first 100 records in Grid view:
    maxRecords: 3,
    view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      // Save record into an array
      sacInfoObj[record.get('Card ID')] = record.id
    });
    

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
        callback()
      });
}

// Express routings
app.get('/', (req, res) => {
  res.render('index', { layout: 'main' });
});

app.post('/', (req, res) => {
  const card_id = req.body.cardID
  sacInfo(function(){
    // If Card ID can be found in SAC Information
    if (card_id in sacInfoObj){
      const checkInDateTime = new Date()
      const recordId = sacInfoObj[card_id]
        base('SAC Time Sheet').create([
          {
            "fields": {
              "Card ID":card_id,
              "SAC Name":[recordId],
              "Admin Number":[recordId],
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
          'statusSuccessIn': true,
          'timeLogged': checkInDateTime.toLocaleTimeString()
        })
    }
    // If Card ID cannot be found in SAC Information
    else{
      // Feedback: User Not Found
      res.render('index',{
        'statusFail': true
      })
    }
  })
  
  
})

// Initialise webserver
app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`)
})