'use strict';

const request = require('request');
const uuidv5 = require('uuid/v5');
const AWS = require('aws-sdk');
const bucketName = process.env.HTML_BUCKET_NAME;
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

exports.handler = (event, context, callback) => {
  // Expects an SQS event.
  let body = event.Records[0].body
  let json = JSON.parse(body || '{}');
  let sourceUrl = json.sourceUrl;
  if (!sourceUrl) {
    let error = new Error('No valid url found for parsing.');
    console.error(error);
    return callback(error);
  }

  getHtml(sourceUrl, (error, htmlObj) => {
    if (error) {
      console.error(error);
      return callback(error);
    }
    saveHtmlToStorage(htmlObj, (error) => {
      if (error) {
        console.error(error);
        return callback(error);
      }
      sendStorageUrlToQueue(htmlObj.sourceUrl, (error) => {
        if (error) {
          console.error(error);
          return callback(error);
        }
        let response = {
          statusCode: 204
        };
        callback(null, response);
      });
    });
  });
};

const getHtml = (sourceUrl, callback) => {
  request(sourceUrl, (error, resp, html) => {
    if (error) {
      return callback(error);
    }

    let htmlObj = {
      sourceUrl: sourceUrl,
      html: html
    }
    callback(null, htmlObj);
  });
};

const saveHtmlToStorage = (htmlObj, callback) => {
  let params = {
    Bucket: bucketName,
    Key: uuidv5(htmlObj.sourceUrl, uuidv5.URL),
    Body: htmlObj.html
  }
  s3.putObject(params, (error, data) => {
    if (error) {
      return callback(error);
    }

    callback();
  });
};

const sendStorageUrlToQueue = (sourceUrl, callback) => {
  let queueUrl = process.env.PARSE_QUEUE_URL;
  let storageParams = {
    Bucket: bucketName,
    Key: sourceUrl
  }
  let params = {
    MessageBody: JSON.stringify(storageParams),
    QueueUrl: queueUrl
  }
  sqs.sendMessage(params, (error, response) => {
    if (error) {
        return callback(error);
    }

    console.log('Send message to SQS', response);
    callback();
  });
};
