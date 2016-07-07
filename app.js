// Project Copilot Core Services
// Copyright 2016 Project Copilot

var port = 3000;
var app = require('express')();
var bodyParser = require('body-parser');
var colors = require('colors');
var dotenv = require('dotenv');
var gun = require('gun');
var hashid = require('hashids');

/* SET UP */
dotenv.load(); // import environment variables from .env file
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
var hash = new hashid(process.env.HASH_SALT);
var db = gun();

app.get('/', function (req, res) {
  res.send('Hello World!');
});


/* CORE API ENDPOINTS */

/*
  POST /api/request -- takes input from HTML form in
  the user-client and adds it to a database (currently mongodb)
*/
app.post('/api/request', function (req, res) {

});

app.listen(port, function () {
  console.log(('Copilot Core Services running at ').blue + ('localhost:'+port).magenta);
});
