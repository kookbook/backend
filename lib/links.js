'use strict';

const validUrl = require('valid-url');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
  let json = JSON.parse(event.body || '{}');
  let sourceUrl = json.sourceUrl.replace(/\/$/, '').toLowerCase();
  if (!sourceUrl || !validUrl.isWebUri(sourceUrl)) {
    let error = new Error('No valid url found.');
    console.error(error);
    return callback(error);
  }

  saveSourceUrlToRecipeDatabase(sourceUrl, (error) => {
    let recipe = {
      sourceUrl: sourceUrl
    }
    let response = {
      statusCode: 200,
      body: JSON.stringify(recipe)
    };
    if (error && error.code !== 'ConditionalCheckFailedException') {
      console.error(error);
      return callback(error);
    } else if (error && error.code === 'ConditionalCheckFailedException') {
      return callback(null, response);
    }

    sendRecipeToQueue(recipe, (error) => {
      if (error) {
        console.error(error);
        return callback(error);
      }

      callback(null, response);
    });
  });
};

const saveSourceUrlToRecipeDatabase = (sourceUrl, callback) => {
  let tableName = process.env.RECIPE_TABLE;
  let recipe = {}
  recipe.sourceUrl = sourceUrl;
  recipe.createdAt = Date.now();
  recipe.updatedAt = recipe.createdAt;
  let params = {
    TableName: tableName,
    Item: recipe,
    ConditionExpression: 'attribute_not_exists(#sourceUrl)',
    ExpressionAttributeNames: {
      "#sourceUrl": "sourceUrl"
    }
  };
  dynamo.put(params, (error, data) => {
    if (error) {
      return callback(error);
    }

    callback(null, recipe);
  });
};

const sendRecipeToQueue = (recipe, callback) => {
  let queueUrl = process.env.GET_QUEUE_URL;
  let params = {
    MessageBody: JSON.stringify(recipe),
    QueueUrl: queueUrl
  };
  sqs.sendMessage(params, (error, response) => {
    if (error) {
        return callback(error);
    }

    callback();
  });
};
