require('dotenv').config({ path: `${__dirname}/../../.env` });

const email = require('sendgrid')(process.env.SENDGRID_API_KEY);

exports = module.exports = {};

exports.send = (contact, body, subject) => {
    return new Promise((resolve, reject) => {
        var message = new email.Email({
            to: contact,
            from: process.env.SENDGRID_EMAIL,
            fromname: 'Project Copilot',
            subject,
            text: body
        });

        const conversation_id = new Buffer(contact).toString('base64');
        
        message.addFilter('footer','enable', 1);
        var footerMessage = "This email is confidential. If you are not the intended recipient, delete this email and all attachments immediately.";
        message.addFilter('footer','text/plain','\n\n--\n' + footerMessage);
        message.addFilter('footer','text/html','<p>--<br><i>' + footerMessage + "</i></p>");
        
        message.addHeader({'In-Reply-To': `<${conversation_id}@support.copilot.help>`});
        message.addHeader({'References': `<${conversation_id}@support.copilot.help>`});

        email.send(message, (e, json) => {
            if (e) {
                console.error(e);
                return reject("Error");
            }
            console.log('Successfully sent email.');
            return resolve("Success");
        });
    });
}
