/**
  * Project Copilot Communications Sysmte
  * Seamlessly handles all communication between volunteers and users
*/
var twilio = require('twilio');
var sg = require('sendgrid').SendGrid(process.env.SENDGRID_API_KEY)

var exports = module.exports = {};

exports.send = function(type, contact) {
  if (type == "contact") {

  }
}
