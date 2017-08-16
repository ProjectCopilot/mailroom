require('dotenv').config({ path: `${__dirname}/../../.env` });

const twilio = require('twilio');
const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports = module.exports = {};
exports.send = (contact, body) => {
    return new Promise((resolve, reject) => {
	client.messages.create({
	    to: contact,
	    from: process.env.TWILIO_PHONE_NUMBER,
	    body,
	}, (e, m) => {
	    if (!e) {
		console.log('Successfully sent SMS with SID', m.sid);
		return resolve("Success");
	    }
	    else {
		console.log(e);
		return reject("Error");
	    }
	});
    });
}
