/**
  * Project Copilot Communications System
  * Seamlessly handles all communication between volunteers and users
*/
require('colors');
require('dotenv').config({ path: `${__dirname}/../.env` });

const twilio = require('twilio');
const sms = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const email = require('sendgrid')(process.env.SENDGRID_API_KEY);
const emailParser = require('emailreplyparser');
const fs = require('fs');


exports = module.exports = {};

// Sends an outgoing message
exports.send = (type, contact, body, subject) => {
  if (type.toLowerCase() === 'email') {
    fs.readFile(`${__dirname}/../templates/message.html`, 'utf-8', (err, data) => {
      const emailBody = data.replace(/{HEADER-MESSAGE}/g, subject).replace(/{MESSAGE-BODY}/g, body);

      email.send({
        to: contact,
        from: process.env.SENDGRID_EMAIL,
        fromname: 'Project Copilot',
        subject,
        html: emailBody,
      }, (e) => {
        if (e) { return console.error(e); }
        console.log('Successfully sent email.'.green);
      });
    });
  } else if (type.toLowerCase() === 'sms') {
    sms.sms.messages.create({
      to: contact,
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
    }, (e, m) => {
      if (!e) {
        console.log('Successfully sent SMS with SID'.green, (m.sid).magenta);
      } else {
        console.log('Error sending SMS message to '.red + (contact).blue);
      }
    });
  }
};

// Isolates email body in giant email conversation blob
exports.stripEmail = (body) => emailParser.EmailReplyParser.parse_reply(body);
