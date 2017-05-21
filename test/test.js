const assert = require('assert');
const request = require('request');
const app = require('../app');

describe('Miscellaneous', function() {
  describe('#validateRequestParameters(schema, request)', function() {
    it('should return true if a request body adheres to specified schema', function() {

      const schema = {name: 'String', age: 0, gender: 'String'};
      const request = {name: 'Lorem Copilot', age: 19, gender: 'Male'};
      const f = app.validateRequestParameters(schema, request)
      assert.equal(true, f.valid);
    });
  });

  describe('#validatePhoneNumber(number)', function() {
    it('should return true if a phone number is valid', function() {
      assert.equal(4, app.validatePhoneNumber('+1 (314) 149-1252').length);
    });
  });
});

describe('Communication', function() {
  describe('GET /up', function() {
    it('200 OK if server is running', function() {
      request('http://0.0.0.0:3000/up', function (err, res, body) {
        assert.equal(200, res.statusCode)
      });
    });
  });
});
