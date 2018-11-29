'use strict';

const request = require('request');
const cheerio = require('cheerio');
const uuidv5 = require('uuid/v5');
const url = require('url');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true
});

exports.handler = (event, context, callback) => {
  // Expects an SQS event from getHtml.
  let body = event.Records[0].body
  let storageParams = JSON.parse(body || '{}');
  let sourceUrl = storageParams.Key;

  getHtml(storageParams, (error, html) => {
    if (error) {
      console.error(error);
      return callback(error);
    }

    const recipe = parseRecipe(html, sourceUrl);
    saveRecipeToDatabase(recipe, (error) => {
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
};

const getHtml = (storageParams, callback) => {
  let params = {
    Bucket: storageParams.Bucket,
    Key: uuidv5(storageParams.Key, uuidv5.URL)
  }
  s3.getObject(params, (error, data) => {
    if (error) {
        return callback(error);
    }

    callback(null, data.Body);
  });
};

const saveRecipeToDatabase = (recipe, callback) => {
  let tableName = process.env.RECIPE_TABLE;
  let params = {
    TableName: tableName,
    Item: recipe
  };
  dynamo.put(params, (error, data) => {
    if (error) {
      return callback(error);
    }

    callback(null);
  });
};

const parseRecipe = (html, sourceUrl) => {
  let recipe = {}
  recipe.sourceUrl = sourceUrl;
  recipe.updatedAt = Date.now();
  let hostname = url.parse(sourceUrl).hostname.replace('www.', '');
  recipe.hostname = hostname;
  switch (hostname) {
    case 'chefkoch.de':
      return parseChefkochDetails(html, recipe);
    default:
      return recipe;
  }
};

const parseChefkochDetails = (html, recipe) => {
  let $ = cheerio.load(html, {
    normalizeWhitespace: true
  });
  recipe.title = $('.page-title').text().trim();
  recipe.subTitle = $('.summary').text().trim();
  recipe.generalInformation = $('#preparation-info').text().trim().replace(/\s\s+/g, ' ');
  recipe.directions = $('.instructions').text().trim();
  recipe.coverImageSourceUrl = $('.recipe-image > a').attr('href').trim();
  recipe.ingredients = $('.incredients tr').map((i, element) => $(element).text().replace(/\s\s+/g, ' ').trim()).get();
  return recipe;
};
