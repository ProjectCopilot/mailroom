# Project Copilot Core Services
Copilot backend.


### Setup
Populate ```.env``` file in project root with the following information:
```
PORT=XXXX
HOSTNAME=[0.0.0.0|127.0.0.X|localhost|etc.]
HASH_LENGTH=XXXX
HASH_SALT=XXXXXXXXXXXXXXXX
RETHINK_HOSTNAME=[0.0.0.0|127.0.0.X|localhost|etc.]
RETHINK_PORT=XXXXX
TWILIO_ACCOUNT_SID=XXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=XXXXXXXXXXX
SENDGRID_API_KEY=XXXXXXXXXXXXXXXXXXXX
```

Install [RethinkDB](https://www.rethinkdb.com/) and the npm dependencies.
```
$ [sudo] npm install
```

Install the dependencies of for ```copilot-communications``` and ```copilot-prioritize```:
```
$ cd copilot-communications; [sudo] npm install; cd ../copilot-prioritize; [sudo] npm install; cd ../
```

Start the database.
```
$ rethinkdb --driver-port XXXXX
```
Run the server.
```
$ node app.js
```
