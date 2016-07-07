// Project Copilot Core Services
// Copyright 2016 Project Copilot

var port = 3000;
var bodyParser = require('body-parser');
var colors = require('colors');
var express = require('express');
var app = express();

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
