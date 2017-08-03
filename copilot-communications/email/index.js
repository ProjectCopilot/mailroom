require('dotenv').config({ path: `${__dirname}/../../.env` });

const email = require('sendgrid')(process.env.SENDGRID_API_KEY);
const fs = require('fs');

exports = module.exports = {};

exports.send = (contact, body, subject) => {
  fs.readFile(`${__dirname}/../../templates/message.html`, 'utf-8', (err, data) => {
    const emailBody = data.replace(/{HEADER-MESSAGE}/g, subject).replace(/{MESSAGE-BODY}/g, body);
    var message = new email.Email({
      to: contact,
      from: process.env.SENDGRID_EMAIL,
      fromname: 'Project Copilot',
      subject,
      html: emailBody,
      text: body
    });

    const conversation_id = new Buffer(contact).toString('base64');
    message.addHeader({'In-Reply-To': `<${conversation_id}@support.copilot.help>`});
    message.addHeader({'References': `<${conversation_id}@support.copilot.help>`});

    email.send(message, (e, json) => {
      if (e) { return console.error(e); }
      console.log('Successfully sent email.');
    });
  });
}
