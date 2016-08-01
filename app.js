// Project Copilot Core Services
// Copyright 2016 Project Copilot

const app = require('express')();
const bandname = require('bandname');
const bodyParser = require('body-parser');
const colors = require('colors');
const communicate = require(__dirname + '/copilot-communications/index.js');
const dotenv = require('dotenv').config({ path: __dirname + '/.env' });
const firebase = require('firebase');
const hashid = require('hashids');
const multiparty = require('multiparty');
const prioritize = require(__dirname + '/copilot-prioritize/index.js');

require('shelljs/global');

/* SET UP */
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) { // enable CORS and assume JSON return structure
  res.setHeader('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// setup Firebase
firebase.initializeApp({
  serviceAccount: __dirname + '/' + process.env.FIREBASE_KEY_PATH,
  databaseURL: 'https://' + process.env.FIREBASE_ID + '.firebaseio.com',
});

// Initialize database
const db = firebase.database().ref('/');

const hash = new hashid(process.env.HASH_SALT, process.env.HASH_LENGTH);


/* CORE API ENDPOINTS */

/*
  POST /api/request -- takes input from HTML form in
  the user-client and adds it to a database (currently RethinkDB)
*/
app.post('/api/addUserRequest', function (req, res) {
  // specify required POST body schema
  const schema = {
    referral: 'String',
    name: 'String',
    age: 0,
    gender: 'String',
    school: 'String',
    contactMethod: 'String',
    contact: 'String',
    situation: 'String',
  };

  // validate the request body based on the specified schema
  const checkParams = validateRequestParameters(schema, req.body);

  // process entry
  if (checkParams.valid === true) {
    let hasDuplicateCase = false;

    // check if a request with the same contact info has not already been submitted
    db.child('cases').once('value', function (snapshot) {
      if (snapshot.val() !== null) {
        for (const k in snapshot.val()) {
          const numberPattern = /\d+/g;

          if (snapshot.val()[k].contactMethod === 'SMS') {
            if ((snapshot.val()[k].contact).match(numberPattern).join('').substr(-10) === (req.body.contact).match(numberPattern).join('').substr(-10)) {
              hasDuplicateCase = true;
              break;
            }
          } else if (snapshot.val()[k].contactMethod == 'Email' && snapshot.val()[k].contact == req.body.contact) {
            hasDuplicateCase = true;
            break;
          }
        }

        if (hasDuplicateCase === true) {
          res.status(409).end();
          return;
        }

        var pendingRequest = req.body;
        pendingRequest['display_name'] = bandname();
        pendingRequest['time_submitted'] = new Date().getTime();
        pendingRequest['helped'] = false;
        var id = hash.encode(pendingRequest.time_submitted);
        console.log('New case submitted with ID: '.green + (id).magenta);
        db.child('cases').child(id).set(req.body, function () {
          res.status(200).end();
        });
      } else {
        var pendingRequest = req.body;
        pendingRequest['display_name'] = bandname();
        pendingRequest['time_submitted'] = new Date().getTime();
        pendingRequest['helped'] = false;
        var id = hash.encode(pendingRequest.time_submitted);
        console.log('New case submitted with ID: '.green + (id).magenta);
        db.child('cases').child(id).set(req.body, function () {
          res.status(200).end();
        });
      }
    });
  } else { // otherwise return error
    console.log('/api/addUserRequest'.cyan + ' had bad request for: '.blue + (checkParams.reason).red);
    res.status(500).end();
  }
});


/*
  GET /api/getNewRequests -- using the prioritize function, return the most urgent inquiries
  No schema necessary.
*/
app.get('/api/getRequests/:number', function (req, res) {
    // get the number of desired cases
  const numRequests = req.params.number;

  db.child('cases').orderByChild('time_submitted').limitToFirst(parseInt(numRequests, 10)).once('value', function (snapshot) {
    res.send(snapshot.val());
  });
});


/*
  FIREBASE REAL-TIME HANDLERS
*/

// If a new message comes from a volunteer, route that to the user
db.child('cases').on('value', function (snap) {
  for (const k in snap.val()) {
    for (const m in snap.val()[k].messages) {
      if (snap.val()[k].messages[m].sender === 'volunteer' && snap.val()[k].messages[m].sent === false) {
        const method = snap.val()[k].contactMethod;
        const contact = snap.val()[k].contact;
        const body = snap.val()[k].messages[m].body;
        const subject = 'New Message';
        communicate.send(method, contact, body, subject);
        db.child('cases').child(k).child('messages').child(m).child('sent').set(true);
      }
    }
  }
});


/* COMMUNICATION ENDPOINTS/WEBHOOKS */

// Incoming email (SendGrid) webhook
app.post('/communication/incoming/email', function (req, res) {
  const form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    const fromEmail = JSON.parse(fields.envelope).from;
    const rawEmailBody = fields.text[0];
    const fromHeader = fields.from[0];

    const body = rawEmailBody;// stripEmail(rawEmailBody, fromHeader);

    const attachments = [];
    for (const key in files) {
      const fileInfo = files[key][0];
      const path = fileInfo.path;
      const uploadOutString = exec(__dirname + '/util/imgur.sh ' + path + ' ' + process.env.IMGUR_CLIENT_ID, { silent: true }).stdout.replace(/\/n/g, '').trim();
      const uploadResponse = uploadOutString.indexOf('Error: ENOSPC') > -1 ? false : uploadOutString;

      if (uploadResponse !== false) {
        attachments.push(uploadResponse);
      }
    }

    const message = {
      'from': fromEmail,
      body,
      attachments,
      'sender': 'user',
    };

    db.child('cases').once('value', function (s) {
      for (const k in s.val()) {
        if (s.val()[k]['contact'] == message.from) {
          db.child('cases').child(k).child('messages').push(message);
        }
      }
    });

    res.status(200).end();
  });
});

// Incoming SMS (Twilio) webhook
app.post('/communication/incoming/sms', function (req, res) {
  const attachments = [];
  for (let i = 0; i < parseInt(req.body.NumMedia, 10); i++) {
    attachments.push(req.body['MediaUrl' + i.toString()]);
  }

  const numberPattern = /\d+/g;

  const message = {
    'from': (req.body.From).match(numberPattern).join('').substr(-10),
    'body': req.body.Body,
    attachments,
    'sender': 'user',
  };


  db.child('cases').once('value', function (s) {
    for (const k in s.val()) {
      if (s.val()[k]['contact'].match(numberPattern) !== null) {
        if (s.val()[k]['contact'].match(numberPattern).join('').substr(-10) == message.from) {
          db.child('cases').child(k).child('messages').push(message);
        }
      }
    }
  });

  res.status(200).end();
});

// Our humble uptime check
app.get('/up', function (req, res) {
    res.status(200).end();
});

/* HELPER FUNCTIONS */

// given a body schema and the actual request body, return whether request body is valid or not and reason
function validateRequestParameters(schema, body) {
  let valid = true;
  let reason = 'None';
  for (const field in schema) {
    if (!(field in body)) {
      valid = false;
      reason = 'Missing parameters.';
      break;
    }
    if (typeof(schema[field]) == 'string' && body[field].length == 0) {
      valid = false;
      reason = 'Cannot pass empty string as parameter value.';
      break;
    }
    if (typeof(schema[field]) == 'number' && typeof(body[field]) == 'string' && isNaN(parseInt(body[field], 10))) {
      valid = false;
      reason = 'Cannot pass NaN value as numreic parameter value.';
      break;
    }
  }

  return { valid, reason };
}


// Removes reply message headers from emails
function stripEmail(emailString, fromHeader) {
  return emailString.substr(0, emailString.indexOf(fromHeader));
}


app.listen(process.env.PORT, process.env.HOSTNAME, function () {
  console.log(('Copilot Core Services running at ').blue + (process.env.HOSTNAME + ':' + process.env.PORT).magenta);
  console.log('Node ' + exec('node --version', { silent: true }).stdout);
});
