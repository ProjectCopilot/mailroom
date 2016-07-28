/**
  * Project Copilot Communications Sysmte
  * Seamlessly handles all communication between volunteers and users
*/
var colors = require('colors');
var dotenv = require('dotenv').config({path: __dirname+'/../.env'});
var twilio = require('twilio')
var sms = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var email = require('sendgrid')(process.env.SENDGRID_API_KEY)
var fs = require('fs');

var exports = module.exports = {};

exports.send = function(type, contact, body, subject) {
  if (type.toLowerCase() == "email") {

    fs.readFile(__dirname+'/../templates/message.html', 'utf-8', function (err, data) {
        var emailBody = data.replace(/{HEADER-MESSAGE}/g, subject).replace(/{MESSAGE-BODY}/g, body);

        email.send({
          to:       contact,
          from:     process.env.SENDGRID_EMAIL,
          fromname: 'Project Copilot',
          subject:  subject,
          html:     emailBody,
        }, function(err, json) {
          if (err) { return console.error(err); }
          console.log("Successfully sent email.".green);
        });
    });

  } else if (type.toLowerCase() == "sms") {
    sms.sms.messages.create({
      to: contact,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: body
    }, function (e, m) {
      if (!e) {
        console.log("Successfully sent SMS with SID".green, (m.sid).magenta);
      } else {
        console.log("Error sending SMS message to ".red+(contact).blue);
      }
    });
  }
}
