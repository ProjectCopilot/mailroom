# mailroom
Copilot core back-end. This server is responsible for routing all of our messages between users and volunteers as well as handling our database.


### Setup
Populate ```.env``` file in project root with the following information:
```
PORT=XXXX
HOSTNAME=[0.0.0.0|127.0.0.X|localhost|etc.]
HASH_LENGTH=XXXX
HASH_SALT=XXXXXXXXXXXXXXXX
FIREBASE_KEY_PATH=XXXXXXXXXX.json
FIREBASE_ID=XXXXXXXXXXXXX
IMGUR_CLIENT_ID=XXXXXXXXXXX
TWILIO_ACCOUNT_SID=XXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=XXXXXXXXXXX
SENDGRID_API_KEY=XXXXXXXXXXXXXXXXXXXX
SENDGRID_EMAIL=hello@XXXXX.XXXX
NOW_LOGS_SECRET=XXXXXXXXX
KEEN_PROJECTID=XXXXXXXXXXXXXXXXXXXXXXXX
KEEN_WRITEKEY=XXXXXXXXX...XXXXXXXXXXXXX
```

Install the dependencies.
```
$ ./build.sh
```

Run the server.
```
$ node app.js
```
