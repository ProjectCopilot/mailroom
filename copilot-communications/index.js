/**
  * Project Copilot Communications Sysmte
  * Seamlessly handles all communication between volunteers and users
*/
var dotenv = require('dotenv').config({path: __dirname+'/../.env'});
var sms = new require('twilio').RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var email = require('sendgrid').SendGrid(process.env.SENDGRID_API_KEY)
var fs = require('fs');

var exports = module.exports = {};

exports.send = function(type, contact, subject, body) {
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
        });
    });

  } else if (type.toLowerCase() == "sms") {
    sms.sms.messages.create({
      to: contact,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: body
    }, function (e, m) {
      if (!e) {
        console.log("Successfully sent SMS with SID ".green, (message.sid).magenta);
      } else {
        console.log("Error sending SMS message to ".red+(contact).blue);
      }
    });
  }
}
