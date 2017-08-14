/**
  * Project Copilot Communications System
  * Seamlessly handles all communication between volunteers and users
*/

const sms = require(`${__dirname}/sms/index.js`);
const email = require(`${__dirname}/email/index.js`);
const emailParser = require('emailreplyparser');

exports = module.exports = {};

// Sends an outgoing message
exports.send = (type, contact, body, subject) => {
  if (type.toLowerCase() === 'email') {
    return email.send(contact, body, subject);
  } else if (type.toLowerCase() === 'sms') {
    return sms.send(contact, body);
  }
};

// Isolates email body in giant email conversation blob
exports.stripEmail = (body) => emailParser.EmailReplyParser.parse_reply(body);
