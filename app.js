// Project Copilot Core Services
// Copyright 2016 Project Copilot

var port = 3000;
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log('Copilot Core Services running.');
});
