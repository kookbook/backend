'use strict';

const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = (event, context, callback) => {
  let queueUrl = process.env.SQS_URL;
  let params = {
      MessageBody: event.body,
      QueueUrl: queueUrl
  };

  sqs.sendMessage(params, function(error, data) {
        if (error) {
            console.error(error);
            callback(error);
            return;
        }
        console.log('data:', data.MessageId);
        // TODO: Change response to something useful for the client.
        let responseBody = {};
        responseBody.message = 'Sent to ' + queueUrl;
        responseBody.messageId = data.MessageId;
        var response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseBody)
        };
        callback(null, response);
    });
};
