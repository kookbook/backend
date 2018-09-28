'use strict';

const request = require('request');
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
    console.log("Here");
    if (error) {
      console.error(error);
      return callback(error);
    }
    console.log("Here2");
    saveHtmlToStorage(htmlObj, (error) => {
      console.log("Here3");
      console.log("Bucket", bucketName);
      if (error) {
        console.error(error);
        return callback(error);
      }
      console.log("Here4");
      sendStorageUrlToQueue(htmlObj.sourceUrl, (error) => {
        console.log("Here5");
        if (error) {
          console.error(error);
          return callback(error);
        }
        console.log("Here6");
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
    Key: htmlObj.sourceUrl, // TODO: Beware of using slashes in S3 key naming -> folders
    Body: htmlObj.html
  }
  s3.putObject(params, (error, data) => {
    if (error) {
      return callback(error);
    }

    console.log('S3 Data', data);
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
