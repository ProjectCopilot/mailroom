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

  // process entry
  if (valid == true) {

    res.status(200);
  } else { // otherwise return error
    res.status(500);
  }

});


// given a body schema and the actual request body, return whether request body is valid or not
function validateRequestParameters(schema, body) {
  var valid = true;


  for (var field in schema) {
    if (field == "age" && isNaN(parseInt(req.body[field], 10))) {
      valid = false;
    } else if (field == "situation" && req.body[field].length == 0) {
      valid = false;
    } else if (field == "name" && req.body[field].length == 0) {
      valid = false;
    } else if (field == "gender" && req.body[field].length == 0) {
      valid = false;
    } else if (field == "contact" && req.body[field].length == 0) {
      valid = false;
    } else if (field == "contactMethod" && req.body[field].length == 0) {
      valid = false;
    }
  }

  return valid;
}

app.listen(process.env.PORT, function () {
  console.log(('Copilot Core Services running at ').blue + ('localhost:'+process.env.PORT).magenta);
});
