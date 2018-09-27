'use strict';

const request = require('request');
const validUrl = require('valid-url');

exports.handler = (event, context, callback) => {
  let json = JSON.parse(event.body || '{}');
  let sourceUrl = json.sourceUrl;
  if (!sourceUrl || !validUrl.isWebUri(sourceUrl)) {
    let error = new Error('Not a valid source for scraping.');
    console.error(error);
    callback(error);
    return;
  }
  getHtml(sourceUrl, callback);
};

const getHtml = (sourceUrl, callback) => {
  request(sourceUrl, (error, resp, html) => {
    if (error) {
      callback(error);
      return;
    }
    let response = {
      statusCode: 200,
      body: {
        sourceUrl: sourceUrl,
        html: html
      }
    }
    callback(null, response);
  });
}
