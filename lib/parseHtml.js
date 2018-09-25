'use strict';

const request = require('request');
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
const url = require('url');

exports.handler = (event, context, callback) => {
  try {
    let json = JSON.parse(event.body || '{}');
    let html = json.html;
    let sourceUrl = json.sourceUrl;
    if (!html) {
      let error = new Error('Missing html to parse.');
      throw `Application Error (${error})`;
    }
    let response = {
        statusCode: 200,
        body: parseRecipe(html, sourceUrl)
    };
    callback(null, response);
  } catch (error) {
    console.error(error);
    callback(error, null);
  }
};

const parseRecipe = (html, sourceUrl) => {
  // TODO: Save raw html in combination with future recipe id to collect data for future model,
  // eventually also track and save edits made to recipe.
  let recipe = {};
  recipe.recipeId = uuidv4();
  recipe.sourceUrl = sourceUrl;
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
