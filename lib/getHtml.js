'use strict';

const request = require('request');
const validUrl = require('valid-url');

exports.handler = (event, context, callback) => {
  try {
    let json = JSON.parse(event.body || '{}');
    let sourceUrl = json.sourceUrl.replace(/\/$/, '').toLowerCase();
    if (!sourceUrl || !validUrl.isWebUri(sourceUrl)) {
      let error = new Error('Not a valid source for scraping.');
      throw `Application Error (${error})`;
    }

    request.get(sourceUrl, (error, response, html) => {
      if (error) {
        throw `Request Error (${error})`;
      } else {
        let response = {
            statusCode: 200,
            body: {
              sourceUrl: sourceUrl,
              html: html
            }
        };
        callback(null, response);
      }
    });
  } catch (error) {
    console.error(error);
    callback(error, null);
  }
};
