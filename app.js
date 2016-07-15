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

var connection = null;
r.connect( {host: process.env.RETHINK_HOSTNAME, port: process.env.RETHINK_PORT}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    // Set up the various database tables
    r.tableCreate('requests').run(connection, function(e, result) {
      if (e) {
        console.log("RethinkDB ".cyan + (e.name).red + ": " + (e.msg).red);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

    });
})





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
    referral: 'String',
    name: 'String',
    age: 10,
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
    r.table('requests').insert([req.body]).run(connection, function (e, r) {
      if (e) throw e;
      console.log("RethinkDB: ".cyan + (JSON.stringify(r.generated_keys, null, 2)).green);
      res.status(200).end();
    });


  } else { // otherwise return error
    console.log("/api/addUserRequest".cyan + " had bad request for: ".blue + (checkParams.reason).red);
    res.status(500).end();
  }

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
  console.log(('Copilot Core Services running at ').blue + (process.env.HOSTNAME+":"+process.env.PORT).magenta);
});
