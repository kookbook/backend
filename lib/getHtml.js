'use strict';

const request = require('request');
const validUrl = require('valid-url');

exports.handler = (req, context, callback) => {
  try {
    let requestJson = JSON.parse(req.body || '{}');
    let sourceUrl = requestJson.sourceUrl.replace(/\/$/, '').toLowerCase();
    if (!sourceUrl || !validUrl.isWebUri(sourceUrl)) {
      let error = new Error('Not a valid source for scraping.');
      throw `Application Error (${error})`;
    }

    request(sourceUrl, (error, response, html) => {
      if (error) {
        throw `Request Error (${error})`;
      } else {
        let response = {
            statusCode: 200,
            body: html
        };
        callback(null, response);
      }
    });
  } catch (error) {
    callback(error, null);
  }
};
