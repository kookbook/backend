'use strict';

const assert = require('chai').assert;
const links = require('../lib/links.js');

describe('links.handler', () => {
  it('should save url to database', (done) => {
    let sourceUrl = 'http://example.org';
    let request = {
      body: `{"sourceUrl":"${sourceUrl}"}`,
      httpMethod: 'POST'
    };
    links.handler(request, undefined, (error, response) => {
      // TODO: Add real assertions
      done();
    });
  });
});
