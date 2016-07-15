// Project Copilot Core Services
// Copyright 2016 Project Copilot

var app = require('express')();
var bodyParser = require('body-parser');
var colors = require('colors');
var dotenv = require('dotenv');
var hashid = require('hashids', process.env.HASH_LENGTH);
var r = require('rethinkdb');

/* SET UP */
dotenv.load(); // import environment variables from .env file
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(function(req, res, next) { // enable CORS and assume JSON return structure
  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
var hash = new hashid(process.env.HASH_SALT);
var db = new loki(__dirname+'/main.json'); // intiialize datastore
var pending_requests = db.addCollection("pending_requests"); // pending requests

app.get('/', function (req, res) {
  res.send('Hello World!');
});


/* CORE API ENDPOINTS */

/*
  POST /api/request -- takes input from HTML form in
  the user-client and adds it to a database (currently mongodb)
  {
    name: '',
    age: '',
    gender: '',
    contactMethod: '',
    contact: '',
    situation: ''
  }
*/

app.post('/api/addUserRequest', function (req, res) {
  // specify post body schema
  var schema = {
    name: 'String',
    age: 10,
    gender: 'String',
    contactMethod: 'String',
    contact: 'String',
    situation: 'String'
  }

  // validate the request body based on the specified schema
  var checkParams = validateRequestParameters(schema, req.body);

  // process entry
  if (checkParams.valid === true) {
    res.status(200).end();
  } else { // otherwise return error
    console.log("/api/addUserRequest".cyan + " had bad request for: ".blue + (checkParams.reason).red);
    res.status(500).end();
  }

});

app.get('/api/readDatabase', function(req, res) {
  db.loadDatabase({}, function() {
    res.send(db.getCollection('pending_requests').data);
  });
});


/* HELPER FUNCTIONS */

// given a body schema and the actual request body, return whether request body is valid or not and reason
function validateRequestParameters(schema, body) {
  var valid = true;
  var reason = "None";
  for (var field in schema) {
    if (!(field in body)) {
      valid == false;
      reason = "Missing parameters.";
      break;
    } else {
      if (typeof(schema[field]) == "string" && body[field].length == 0) {
        valid = false;
        reason = "Cannot pass empty string as parameter value.";
        break;
      } else if (typeof(schema[field]) == "number" && typeof(body[field]) == "string") {
        if (isNaN(parseInt(body[field], 10))) {
          valid = false;
          reason = "Cannot pass NaN value as numreic parameter value."
          break;
        }
        break;
      } else if (typeof(schema[field]) !== typeof(body[field])) {
        valid = false;
        reason = "Invalid parameter type " + typeof(body[field]) + " that should be " + typeof(schema[field]) + ".";
        break;
      }
    }
  }

  return {"valid": valid, "reason":reason};
}

app.listen(process.env.PORT, process.env.HOSTNAME, function () {
  console.log(('Copilot Core Services running at ').blue + ('localhost:'+process.env.PORT).magenta);
});
