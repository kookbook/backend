'use strict';

const assert = require('chai').assert;
const getHtml = require('../lib/getHtml.js');

describe('getHtml.handler', () => {
  it('should get raw html code from a given url', (done) => {
    let request = {
      body: '{"sourceUrl":"http://example.org"}',
      httpMethod: 'POST'
    };
    getHtml.handler(request, undefined, (error, response) => {
      assert.equal(200, response.statusCode);
      assert.include(response.body.html, 'Example Domain');
      assert.equal('http://example.org', response.body.sourceUrl);
      done();
    });
  });
});
