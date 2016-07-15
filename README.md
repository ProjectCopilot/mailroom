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
```

Install [RethinkDB](https://www.rethinkdb.com/) and the npm dependencies.
```
$ npm install
```
Start the database.
```
$ rethinkdb --driver-port XXXXX
```
Run the server.
```
$ node app.js
```
