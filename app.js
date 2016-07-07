// Project Copilot Core Services
// Copyright 2016 Project Copilot

var app = require('express')();
var bodyParser = require('body-parser');
var colors = require('colors');
var dotenv = require('dotenv');
var gun = require('gun');
var hashid = require('hashids', process.env.HASH_LENGTH);

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
var db = gun();

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
  // validate entry fields
  var schema = {
    name: 'String',
    age: 10,
    gender: 'String',
    contactMethod: 'String',
    contact: 'String',
    situation: 'String'
  }

  var checkParams = validateRequestParameters(schema, req.body);

  // process entry
  if (checkParams.valid === true) {
    res.status(200);
  } else { // otherwise return error
    console.log("/api/addUserRequest".cyan + " had bad request for: ".blue + (checkParams.reason).red);
    res.status(500);
  }

});


// given a body schema and the actual request body, return whether request body is valid or not
function validateRequestParameters(schema, body) {
  var valid = true;
  var reason = "None";
  for (var field in schema) {
    if (!(field in body)) {
      valid == false;
      reason = "Missing parameters";
      break;
    } else {
      if (typeof(schema[field]) == typeof(body[field])) {
        valid = false;
        reason = "Invalid parameter type.";
        break;
      } else if (typeof(schema[field]) == "string" && body[field].length == 0) {
        valid = false;
        reason = "Cannot pass empty string as parameter value.";
        break;
      }
    }
  }

  return {"valid": valid, "reason":reason};
}

app.listen(process.env.PORT, function () {
  console.log(('Copilot Core Services running at ').blue + ('localhost:'+process.env.PORT).magenta);
});
