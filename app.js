/*
 * Project Copilot Mailroom
 * (c) Copyright 2017 Project Copilot
 */

const app = require('express')();
const bandname = require('bandname');
const bodyParser = require('body-parser');
const communicate = require(`${__dirname}/copilot-communications/index.js`);
const firebase = require('firebase');
const hashid = require('hashids');
const keen = require('keen-tracking');
const multiparty = require('multiparty');
const prioritize = require(`${__dirname}/copilot-prioritize/index.js`);

require('colors');
require('dotenv').config({ path: `${__dirname}/.env` });
require('now-logs')(process.env.NOW_LOGS_SECRET);
require('shelljs/global');

/* SET UP */
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => { // Enable CORS requests
    res.setHeader('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Initialize analytics tracking
let analytics = 0/*new keen({
    projectId: process.env.KEEN_PROJECTID,
    writeKey: process.env.KEEN_WRITEKEY
});*/

// Initialize Firebase
firebase.initializeApp({
    serviceAccount: `${__dirname}/${process.env.FIREBASE_KEY_PATH}`,
    databaseURL: `https://${process.env.FIREBASE_ID}.firebaseio.com`,
});
const db = firebase.database().ref('/');

const hash = new hashid(process.env.HASH_SALT, process.env.HASH_LENGTH);


/* CORE API ENDPOINTS */

/*
  POST /api/request -- takes input from HTML form in
  the user-client and adds it to a database (currently RethinkDB)
*/
app.post('/api/addUserRequest', (req, res) => {
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
	db.child('cases').once('value', (snapshot) => {
	    if (snapshot.val() !== null) {
		Object.keys(snapshot.val()).forEach((k) => {
		    if (snapshot.val()[k].contactMethod === 'SMS' && validatePhoneNumber(req.body.contact) !== null)
			if (validatePhoneNumber(snapshot.val()[k].contact).join('').substr(-10)
			    === validatePhoneNumber(req.body.contact).join('').substr(-10)) {
			    hasDuplicateCase = true;
			    return;
			} else if (snapshot.val()[k].contactMethod === 'Email'
				   && snapshot.val()[k].contact === req.body.contact) {
			    hasDuplicateCase = true;
			    return;
			}
		});

		if (hasDuplicateCase === true) {
		    res.status(409).end();
		    return;
		}

		const pendingRequest = req.body;
		pendingRequest.display_name = bandname();
		pendingRequest.time_submitted = new Date().getTime();
		pendingRequest.helped = false;
		const id = hash.encode(pendingRequest.time_submitted);
		console.log('New case submitted with ID: '.green + (id).magenta);
		db.child('cases').child(id).set(req.body, () => {
		    const message = {
			from: req.body.contact,
			body: req.body.situation,
			sender: 'user',
			seen: false,
			time: Date.now()
		    };
		    db.child('cases').child(id).child('messages').push(message);

		    const log = {
			gender: req.body.gender,
			age: req.body.age,
			method: req.body.contactMethod,
			referral: req.body.referral,
			school: req.body.school
		    }
		    analytics.addEvent('cases', log);

		    res.status(200).end();
		});
	    } else {
		const pendingRequest = req.body;
		pendingRequest.display_name = bandname();
		pendingRequest.time_submitted = new Date().getTime();
		pendingRequest.helped = false;
		const id = hash.encode(pendingRequest.time_submitted);
		console.log('New case submitted with ID: '.green + (id).magenta);
		db.child('cases').child(id).set(req.body, () => {
		    const message = {
			from: req.body.contact,
			body: req.body.situation,
			sender: 'user',
			seen: false,
			time: Date.now()
		    };
		    db.child('cases').child(id).child('messages').push(message);

		    const log = {
			gender: req.body.gender,
			age: req.body.age,
			method: req.body.contactMethod,
			referral: req.body.referral,
			school:req.body.school
		    }
		    analytics.addEvent('cases', log);
		    
		    res.status(200).end();
		});
	    }
	});
    } else { // otherwise return error
	console.log('/api/addUserRequest'.cyan + ' had bad request for: '.blue
                    + (checkParams.reason).red);
	res.status(500).end();
    }
});


/*
  GET /api/getNewRequests -- using the prioritize function, return the most urgent inquiries
  No schema necessary.
*/
app.get('/api/getRequests/:number', (req, res) => {
    // get the number of desired cases
    const numRequests = req.params.number;

    db.child('cases').orderByChild('time_submitted').limitToFirst(parseInt(numRequests, 10))
	.once('value', (snapshot) => {
	    let filtered = {};
	    if (snapshot.val() != null) {
		// filter out private case properties
		Object.keys(snapshot.val()).forEach((k) => {
		    filtered[k] = {
			display_name: snapshot.val()[k].display_name,
			gender: snapshot.val()[k].gender,
			helped: snapshot.val()[k].helped
		    };
		});
	    }
	    res.send(filtered);
    });
});


/*
  FIREBASE REAL-TIME HANDLERS
*/

// If a new message comes from a volunteer, route that to the user
db.child('cases').on('value', (snap) => {
    if (snap.val() != null) {
	Object.keys(snap.val()).forEach((k) => {
            let userCase = snap.val()[k];
            if (userCase.messages != null) {
		Object.keys(userCase.messages).forEach((m) => {
		    const method = userCase.contactMethod;
		    const contact = userCase.contact;
		    const body = userCase.messages[m].body;
		    const subject = 'New Message';

		    if (userCase.messages[m].sender === 'volunteer'
			&& userCase.messages[m].sent === false) {
			
			db.child('cases').child(k).child('messages').child(m).child('sent')
                            .set(true);

			// Send the message
			const call = communicate.send(method, contact, body, subject);
			call.then((data) => {
                            // Success!
			    
			    const log = {
				length: body.length,
				from: 'volunteer',
				volunteer_id: new Buffer(userCase.helped).toString('hex'),
				delivered: true,
				method,
			    };
			    analytics.addEvent('messages', log);
			}).catch((e) => {
			    // Ensure that the handler is firing because of a communication failure
			    if (e == "Error") {
				// There was an error sending the message
				db.child('cases').child(k).child('messages').child(m).child('sent').set('failed');

				const log = {
				    length: body.length,
				    from: 'volunteer',
				    volunteer_id: new Buffer(userCase.helped).toString('hex'),
				    delivered: false,
				    method,
				};
				analytics.addEvent('messages', log);
			    }
			});
		    }	  
		});
            }
	});
    }
});

// Watch inactive cases and open them up if volunteers have not done anything for over 1 hour
setInterval(() => {
    db.child('cases').once('value', (snap) => {
	if (snap.val() != null) {
	    Object.keys(snap.val()).forEach((k) => {
		if (Date.now() - snap.val()[k].last_modified > 60 * 60 * 1000)
		    db.child('cases').child(k).child('helped').set(false);		
	    });
	}
    });
}, 1000);


/* COMMUNICATION ENDPOINTS/WEBHOOKS */

// Incoming email (SendGrid) webhook
app.post('/communication/incoming/email', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
	const fromEmail = JSON.parse(fields.envelope).from;
	const toEmail = JSON.parse(fields.envelope).to;
	if (process.env.SENDGRID_EMAIL != toEmail[0]) {
	    res.status(200).end();
	    return;
	}

	const rawEmailBody = fields.text[0];

	const body = communicate.stripEmail(rawEmailBody);

	const attachments = [];

	Object.keys(files).forEach((key) => {
	    const fileInfo = files[key][0];
	    const path = fileInfo.path;

	    const uploadOutString = exec(`${__dirname}/util/imgur.sh ${path} ${process.env.IMGUR_CLIENT_ID}`, { silent: true }).stdout.replace(/\/n/g, '').trim();
	    const uploadResponse = uploadOutString.indexOf('Error: ENOSPC') > -1 ? false
		  : uploadOutString;

	    if (uploadResponse !== false) {
		attachments.push(uploadResponse);
	    }
	});

	const message = {
	    from: fromEmail,
	    body,
	    attachments,
	    sender: 'user',
	    seen: false,
	    time: Date.now()
	};

	db.child('cases').once('value', (s) => {
	    Object.keys(s.val()).forEach((k) => {
		if (s.val()[k].contact === message.from) {
		    db.child('cases').child(k).child('messages')
			.push(message);

		    const log = {
			length: body.length,
			from: 'user',
			delivered: true,
			method: 'Email',
		    }
		    analytics.addEvent('messages', log);
		}
	    });
	});

	res.status(200).end();
    });
});

// Incoming SMS (Twilio) webhook
app.post('/communication/incoming/sms', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    const attachments = [];
    for (let i = 0; i < parseInt(req.body.NumMedia, 10); i++) {
	attachments.push(req.body[`MediaUrl${i.toString()}`]);
    }

    const message = {
	from: validatePhoneNumber(req.body.From).join('').substr(-10),
	body: req.body.Body,
	attachments,
	sender: 'user',
	seen: false,
	time: Date.now()
    };

    db.child('cases').once('value', (s) => {
	Object.keys(s.val()).forEach((k) => {
	    const match = validatePhoneNumber(s.val()[k].contact);
	    if (match && match.join('').substr(-10) === message.from) {
		db.child('cases').child(k).child('messages')
		    .push(message);

		const log = {
		    length: (req.body.Body).length,
		    from: 'user',
		    delivered: true,
		    method: 'SMS',
		}
		analytics.addEvent('messages', log);
	    }
	});
    });

    res.send('<?xml version="1.0" encoding="UTF-8" ?><Response></Response>');
});

// Our humble uptime check
app.get('/up', (req, res) => {
    res.status(200).end();
});

/* HELPER FUNCTIONS */

// Does a request body adhere to a specified schema?
function validateRequestParameters(schema, body) {
    let valid = true;
    let reason = 'None';
    Object.keys(schema).forEach((field) => {
	if (!(field in body)) {
	    valid = false;
	    reason = 'Missing parameters.';
	    return;
	}
	if (typeof(schema[field]) === 'string' && body[field].length === 0) {
	    valid = false;
	    reason = 'Cannot pass empty string as parameter value.';
	    return;
	}
	if (typeof(schema[field]) === 'number'
            && typeof(body[field]) === 'string'
            && isNaN(parseInt(body[field], 10))) {
	    valid = false;
	    reason = 'Cannot pass NaN value as numreic parameter value.';
	    return;
	}
    });

    return { valid, reason };
}

function validatePhoneNumber(number) {
    const numberPattern = /\d+/g;
    return number.match(numberPattern);
}

module.exports = {validateRequestParameters: validateRequestParameters, validatePhoneNumber: validatePhoneNumber};

app.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log(('Copilot Core Services running at ').blue
		+ (`${process.env.HOSTNAME}:${process.env.PORT}`).magenta);
});
