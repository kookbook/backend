'use strict';

const assert = require('chai').assert;
const parseHtml = require('../lib/parseHtml.js');
const fs = require('fs');

describe('parseHtml.handler', () => {
  it('should parse raw html code to a recipe object from chefkoch.de', (done) => {
    let body = fs.readFileSync('test/chefkochBlob', 'utf8');
    let request = {
      body: body,
      httpMethod: 'POST'
    };
    parseHtml.handler(request, undefined, (error, response) => {
      assert.equal('Erdbeertiramisu', response.body.title);
      assert.equal(9, response.body.ingredients.length);
      done();
    });
  });
});
