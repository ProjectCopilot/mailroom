// Project Copilot Core Services
// Copyright 2016 Project Copilot

var app = require('express')();
var bodyParser = require('body-parser');
var colors = require('colors');
var communicate = require(__dirname+'/copilot-communications/index.js');
var dotenv = require('dotenv').config({path: __dirname+'/.env'});
var firebase = require('firebase');
var hashid = require('hashids');
var multiparty = require('multiparty');
var prioritize = require(__dirname+'/copilot-prioritize/index.js');

require('shelljs/global');

/* SET UP */
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(function(req, res, next) { // enable CORS and assume JSON return structure
  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// setup Firebase
firebase.initializeApp({
  serviceAccount: __dirname+'/'+process.env.FIREBASE_KEY_PATH,
  databaseURL: "https://"+process.env.FIREBASE_ID+".firebaseio.com"
});

// Initialize database
var db = firebase.database().ref("/");

var hash = new hashid(process.env.HASH_SALT, process.env.HASH_LENGTH);



/* CORE API ENDPOINTS */

/*
  POST /api/request -- takes input from HTML form in
  the user-client and adds it to a database (currently RethinkDB)
*/
app.post('/api/addUserRequest', function (req, res) {
  // specify post body schema
  var schema = {
    referral: 'String',
    name: 'String',
    age: 0,
    gender: 'String',
    school: 'String',
    contactMethod: 'String',
    contact: 'String',
    situation: 'String'
  }

  // validate the request body based on the specified schema
  var checkParams = validateRequestParameters(schema, req.body);

  // process entry
  if (checkParams.valid === true) {
    var hasDuplicateCase = false;

    // check if a request with the same contact info has not already been submitted
    db.child("cases").once("value", function (snapshot) {
      if (snapshot.val() !== null) {
        for (var k in snapshot.val()) {
          var numberPattern = /\d+/g;

          if (req.body.contactMethod === "SMS") {

            if ((snapshot.val()[k].contact).match(numberPattern).join("").substr(-10) === (req.body.contact).match(numberPattern).join("").substr(-10)) {
              hasDuplicateCase = true;
              break;
            }
          } else if (req.body.contactMethod == "Email" && snapshot.val()[k].contact == req.body.contact) {
            hasDuplicateCase = true;
            break;
          }
        }

        if (hasDuplicateCase === true) {
          res.status(409).end();
          return;
        }

        var pendingRequest = req.body;
        pendingRequest["time_submitted"] = new Date();
        pendingRequest["helped"] = false;
        var id = hash.encode(pendingRequest.time_submitted);
        db.child("cases").child(id).set(req.body, function () {
          res.status(200).end();
        });

      } else {
        var pendingRequest = req.body;
        pendingRequest["time_submitted"] = new Date();
        pendingRequest["helped"] = false;
        var id = hash.encode(pendingRequest.time_submitted);
        db.child("cases").child(id).set(req.body, function () {
          res.status(200).end();
        });
      }
    });



  } else { // otherwise return error
    console.log("/api/addUserRequest".cyan + " had bad request for: ".blue + (checkParams.reason).red);
    res.status(500).end();
  }

});


/*
  GET /api/getNewRequests -- using the prioritize function, return the most urgent inquiries
  No schema necessary.
*/
app.get("/api/getRequests/:number", function (req, res) {
    // get the number of desired requests
    var numRequests = req.params.number;

    db.child("cases").orderByChild("time_submitted").limitToFirst(parseInt(numRequests, 10)).once("value", function (snapshot) {
      res.send(snapshot.val())
    });
});


/*
  FIREBASE REAL-TIME HANDLERS
*/

// If a new message comes from a volunteer, route that to the user
db.child("cases").on("child_added", function (snap) {
    for (var m in snap.val().messages) {
      if (snap.val().messages[m].sender === "volunteer" && snap.val().messages[m].sent === false) {
        var method = snap.val().contactMethod;
        var contact = snap.val().contact;
        var body = snap.val().messages[m].body;
        var subject = "New Message";
        communicate.send(method, contact, body, subject);
        db.child("cases").child(snap.key).child("messages").child(m).child("sent").set(true);
      }
    }

});


/* COMMUNICATION ENDPOINTS/WEBHOOKS */

// Incoming email (SendGrid) webhook
app.post('/communication/incoming/email', function(req, res) {
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    var fromEmail = JSON.parse(fields.envelope).from;
    var rawEmailBody = fields.text[0];
    var fromHeader = fields.from[0];

    var body = rawEmailBody;// stripEmail(rawEmailBody, fromHeader);


    var attachments = [];
    for (var key in files) {
      var fileInfo = files[key][0];
      var path = fileInfo.path;
      var uploadOutString = exec(__dirname+'/util/imgur.sh '+ path +' '+ process.env.IMGUR_CLIENT_ID, {silent:true}).stdout.replace(/\/n/g, "").trim();
      var uploadResponse = uploadOutString.indexOf("Error: ENOSPC") > -1 ? false : uploadOutString;

      if (uploadResponse !== false) {
        attachments.push(uploadResponse);
      }

    }

    var message = {
      "from": fromEmail,
      "body": body,
      "attachments": attachments,
      "sender": "user"
    };



    db.child("cases").once("value", function (s) {
      for (var k in s.val()) {
        if (s.val()[k]["contact"] == message.from) {
          db.child("cases").child(k).child("messages").push(message);
        }
      }
    });

    res.status(200).end();

  });
});

// Incoming SMS (Twilio) webhook
app.post('/communication/incoming/sms', function (req, res) {
  var attachments = [];
  for (var i = 0; i < parseInt(req.body.NumMedia, 10); i++) {
    attachments.push(req.body["MediaUrl"+i.toString()]);
  }

  var numberPattern = /\d+/g;

  var message = {
    "from": (req.body.From).match(numberPattern).join("").substr(-10),
    "body": req.body.Body,
    "attachments": attachments,
    "sender": "user"
  }


  db.child("cases").once("value", function (s) {
    for (var k in s.val()) {
      if (s.val()[k]["contact"].match(numberPattern) !== null) {
        if (s.val()[k]["contact"].match(numberPattern).join("").substr(-10) == message.from) {
          db.child("cases").child(k).child("messages").push(message);
        }
      }
    }
  });

  res.status(200).end();
});




/* HELPER FUNCTIONS */

// given a body schema and the actual request body, return whether request body is valid or not and reason
function validateRequestParameters(schema, body) {
  var valid = true;
  var reason = "None";
  for (var field in schema) {
    if (!(field in body)) {
      valid = false;
      reason = "Missing parameters.";
      break;
    }
    if (typeof(schema[field]) == "string" && body[field].length == 0) {
      valid = false;
      reason = "Cannot pass empty string as parameter value.";
      break;
    }
    if (typeof(schema[field]) == "number" && typeof(body[field]) == "string" && isNaN(parseInt(body[field], 10))) {
      valid = false;
      reason = "Cannot pass NaN value as numreic parameter value."
      break;
    }
  }

  return {"valid": valid, "reason":reason};
}


// Removes reply message headers from emails
function stripEmail(emailString, fromHeader) {
  return emailString.substr(0, emailString.indexOf(fromHeader));
}


app.listen(process.env.PORT, process.env.HOSTNAME, function () {
  console.log(('Copilot Core Services running at ').blue + (process.env.HOSTNAME+":"+process.env.PORT).magenta);
  console.log('Node '+exec('node --version', {silent:true}).stdout);
});
