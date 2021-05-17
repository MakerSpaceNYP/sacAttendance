// Imports and requires
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const Airtable = require("airtable");
require("dotenv").config();
const app = express();
const package = require("./package.json");

// Cronjob
const CronJob = require('cron').CronJob;

// Express options
app.use(express.static(`public`));
app.use(bodyParser.urlencoded({ extended: true }));
// app.enable('view cache');

// Handlebars options
app.engine(
    "hbs",
    exphbs({
        defaultLayout: "main",
        extname: ".hbs",
        layoutsDir: `views/layouts/`,
    })
);
app.set("view engine", "hbs");
app.set("views", `views`);

// Airtable API Key
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

// Airtable Base ID
const baseId = process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(baseId);

const mail_from = process.env.MAIL_FROM;

// Nodemailer
// const nodemailer = require('nodemailer')
// const transporter = nodemailer.createTransport({
//     host: 'smtp.sendgrid.net',
//     port: 587,
//     auth: {
//         user: 'apikey',
//         pass: process.env.SENDGRID_API_KEY
//     }
// });

// Sendgrid API Key
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Handlebars
const Handlebars = require("handlebars")

// Email Template
const fs = require('fs');
const receiptTemplateSource = fs.readFileSync(`./email/receipt.hbs`, 'utf8')
const receiptTemplate = Handlebars.compile(receiptTemplateSource)

const failedToSignTemplateSource = fs.readFileSync(`./email/failedToSign.hbs`, 'utf8')
const failedToSignTemplate = Handlebars.compile(failedToSignTemplateSource)


// Webserver port
const port = process.env.PORT || 3000;

let sacInfoObj, clockOutDetailsObj, data


// Checks if a card id is present in SAC Information
function isCardIdPresent(cardID, callback, err) {
    /**
     * @param {String} cardID - Card id of the card tapped on the card reader
     * @param {Function} callback - Validation Function
     * @param {Function} err - Error message when Card ID cannot be found.
     */
    let count = 0;
    sacInfoObj = {};
    base("SAC Information")
        .select({
            view: "Grid view",
        })
        .eachPage(function page(records, fetchNextPage) {
            records.forEach(function (record) {
                if (record.get("Card ID") == cardID) {
                    sacInfoObj["cardID"] = record.get("Card ID");
                    sacInfoObj["recordID"] = record.id;
                    callback(sacInfoObj);
                    return;
                } else {
                    count++;
                }
            });
            if (count >= records.length) {
                err();
                return;
            }
            fetchNextPage();
        });
}

function isClockedIn(
    cardID,
    clockIn,
    clockOut,
    statusFailAlreadyIn,
    statusFailAlreadyOut,
    err
) {
    /**
     * @param {String} cardID - Card id of the card tapped on the card reader
     * @param {Function} clockIn - Function to clock SAC In
     * @param {Function} clockOut - Function to clock SAC Out
     * @param {Function} statusfailAlreadyIn - Function to throw error message if SAC trys to clock in within 1 min
     * @param {Function} statusfailAlreadyout - Function to throw error message if SAC trys to clock Out within 1 min
     * @param {Function} err - Error message for repeated clock in
     */

    let count = 0;

    const todayDate = new Date().toISOString().split("T")[0];
    // Retrieve from Airtable SAC Time Sheet
    base("SAC Time Sheet")
        .select({
            view: "Grid view",
            sort: [{ field: "Check In Date-Time", direction: "desc" }],
        })
        .eachPage(function page(records, fetchNextPage) {
            records.some(function (record) {
                let recordDate = record.get("Check In Date-Time").split("T")[0];
                if (record.get("Card ID") == cardID) {
                    // Clock Out Success
                    if (
                        recordDate == todayDate &&
                        record.get("Status") == 'On Shift' &&
                        Date.parse(new Date()) -
                        Date.parse(record.get("Check In Date-Time")) >=
                        6000
                        
                    ) {
                        clockOutDetailsObj={}
                        const clockOutRecordId = record.id;
                        clockOutDetailsObj = {
                            sacName: record.get("SAC Name"),
                            adminNo: record.get("Admin Number"),
                            cardID: record.get("Card ID"),
                            clockInTime: record.get("Check In Date-Time"),
                        };
                        console.log("Clocking Out")
                        clockOut(clockOutRecordId, clockOutDetailsObj);
                        return true

                        // Render Clock In Duplicate template
                    } else if (
                        recordDate == todayDate &&
                        record.get("Status") == 'On Shift' &&
                        Date.parse(new Date()) -
                        Date.parse(record.get("Check In Date-Time")) <
                        6000
                    ) {
                        statusFailAlreadyIn();
                        console.log('Clock In Duplicate')
                        return true

                    }

                    // Clock In Sucess
                    else if (
                        record.get('Status') == 'Pending' ||
                        (record.get("Status") == 'Shift End' &&
                        Date.parse(new Date()) -
                        Date.parse(record.get("Check Out Date-Time")) >=
                        6000)
                    ) {
                        console.log('Clock In')
                        clockIn();
                        return true

                    }

                    // Render Clock Out Duplicate template
                    else if (
                        //recordDate == todayDate &&
                        record.get('Status') == 'Pending' ||
                        (record.get("Status") == 'Shift End' &&
                        Date.parse(new Date()) -
                        Date.parse(record.get("Check Out Date-Time")) <
                        6000)
                    ) {
                        statusFailAlreadyOut();
                        console.log('Clock Out Duplicate')
                        return true

                    }

                    // Unknown Error
                    else {
                        console.log(record.get('Status'))
                        err(err);
                        // console.log('error')
                        return true


                    }
                } else {
                    count++;
                }
            });

            //   No records in the SAC Time Sheet yet
            if (count >= records.length) {
                console.log("Clock In");
                clockIn();
                return false;
            }

            fetchNextPage();
        });
}


// Sends a email to the sac that he failed to clock out
//midnight:00 00 00 * * *





function failedToClockOutEmail(){
    // Loop through the records in SAC Time Sheet
    // BONUS: Only loop through the previous day's record
    
    // If there are records that did not clock out: Update the record's status to pending. 
    // BONUS: Go to airtable and set up such that if the status of a record is equals to pending, then it highlights the whole row orange.

    // Loop through the SAC Information to search for their admin number
    // Store in an array
    // send them a email each
    // basically now do highlight and email
    // const todayDate1 = new Date().toISOString().split("T")[0];

    base('SAC Time Sheet').select({
        // Selecting the first 3 records in Grid view:
    
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
    
        records.forEach(function(record) {
            const clockOutRecordId = record.id;
            let shiftStatus = record.get('Status')
            if (shiftStatus == 'On Shift' ){
               
                
                base('SAC Time Sheet').update(clockOutRecordId, {
                    "Status": "Pending",
                  },
                (err, record) => {
                    if (err) {
                    console.error(err);
                    return;
                    }

                let localClockIn = record.get("Check In Date-Time")

                data = {
                    name: record.get("SAC Name"),
                    adminNo: record.get("Admin Number"),
                    recordID: clockOutRecordId,
                    times:{
                    clockIn: new Date(localClockIn).toLocaleString(),
                    }
                }

                var message = failedToSignTemplate(data);

                // Send Email
                sgMail.send({
                    to: `${data.adminNo[0]}@mymail.nyp.edu.sg`,
                    from: mail_from,
                    subject: "MakerSpaceNYP - End of Shift Not Recorded",
                    html: message
                })
              });           
             }
        });
    
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
    });
}
   

// Use CronJob to run failedToClockOutEmail()

console.log('Before job instantiation');
const job = new CronJob('0 0 * * *', () => {
	failedToClockOutEmail()
}, null, true, "Asia/Singapore");
console.log('After job instantiation');
job.start();



 
// Express routings
app.get("/", (req, res) => {
    res.render("index", { layout: "main" });
});

app.post("/", (req, res) => {
    const card_id = req.body.cardID;
    isCardIdPresent(
        (cardID = card_id),
        // Card present in SAC Information
        () => {
            isClockedIn(
                (cardID = card_id),
                // Clock In Function
                () => {
                    const checkInDateTime = new Date();
                    base("SAC Time Sheet").create([
                        {
                            fields: {
                                "Card ID": sacInfoObj.cardID,
                                SAC_Card_ID: [sacInfoObj.recordID],
                                "Check In Date-Time": checkInDateTime,
                                Status : 'On Shift'
                            },
                        },
                    ]);
                    console.log("Clock In Successful");
                    // Render Clock In Success template
                    res.render("index", {
                        statusSuccessIn: true,
                        timeLogged: checkInDateTime.toLocaleTimeString("en-US", {
                            timeZone: "Asia/Singapore",
                        }),
                    });
                    return;
                },
                // Clock Out Function
                (clockOutRecordId, clockOutDetailsObj) => {
                    const checkOutDateTime = new Date();
                    base("SAC Time Sheet").update(
                        [
                            {
                                id: clockOutRecordId,
                                fields: {
                                    "Check Out Date-Time": checkOutDateTime,
                                    Status : 'Shift End'
                                },
                            },
                        ],
                        function (err) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        
                            let clockInLocalTime = new Date(clockOutDetailsObj.clockInTime)
                            
                            data = {
                                name: clockOutDetailsObj.sacName[0],
								adminNo: clockOutDetailsObj.adminNo[0],
                                recordID: clockOutRecordId,
                                times: {
                                    clockIn: clockInLocalTime.toLocaleString(),
                                    clockOut: checkOutDateTime.toLocaleString()
                                }
                            }

                            var message = receiptTemplate(data);

                            // Send Email
                            sgMail.send({
                                to: `${clockOutDetailsObj.adminNo[0]}@mymail.nyp.edu.sg`,
                                from: mail_from,
                                subject: "MakerSpaceNYP - Your shift receipt",
                                html: message
                            })
						}
                        
                    );
                    // Render Clock Out Success template
                    res.render("index", {
                        statusSuccessOut: true,
                        timeLogged: checkOutDateTime.toLocaleTimeString("en-US", {
                            timeZone: "Asia/Singapore",
                        }),
                    });
                    return;
                },
                // Status Failed Already In
                () => {
                    const errorTime = new Date();
                    res.render("index", {
                        statusFailAlreadyIn: true,
                        error: {
                            timeDone: errorTime.toLocaleTimeString("en-US", {
                                timeZone: "Asia/Singapore",
                            }),
                        },
                    });
                },
                // Status Failed Already Out
                () => {
                    const errorTime = new Date();
                    res.render("index", {
                        statusFailAlreadyOut: true,
                        error: {
                            timeDone: errorTime.toLocaleTimeString("en-US", {
                                timeZone: "Asia/Singapore",
                            }),
                        },
                    });
                },
                // Unknown Error
                (err) => {
                    console.error(err)
                    res.render("index", {
                        statusFail: true,
                    });
                }
            );
        },
        // Error: Cannot Read Card
        (err) => {
            console.error(err)
            res.render("index", {
                statusFail: true,
            });
        }
    );
});

app.get("/about", (req, res) => {
    const timestampNow = new Date();
    res.render("about", {
        version: package.version,
        versionNumber: package.version.split("-")[0],
        versionTime: package.version.split("-")[2],
        versionDate: package.version.split("-")[1],
        osName: process.platform,
        osTime: timestampNow.toLocaleTimeString(),
    });
});

//Error Codes
app.use(function (req, res) {
    if (res.status(400)) {
        res.render("errorCodes", {
            errorCode: "400",
            errorMessage: "Its a bad request!",
        });
    } else if (res.status(404)) {
        res.render("errorCodes", {
            errorCode: "404",
            errorMessage: "Are you on the right page?",
        });
    } else if (res.status(500)) {
        res.render("errorCodes", {
            errorCode: "500",
            errorMessage: "Its a internal server error!",
        });
    } else if (res.status(502)) {
        res.render("errorCodes", {
            errorCode: "502",
            errorMessage: "Its a bad gateway!",
        });
    } else if (res.status(503)) {
        res.render("errorCodes", {
            errorCode: "503",
            errorMessage: "Service is currently unavailable.",
        });
    }
});

// Initialise webserver
app.listen(port, () => {
    console.log(`SAC attandance app listening at http://localhost:${port}`);
})







