"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));

function RecommendationsModel() {}

/**
 * Return count recommendations ids
 * @param {Integer} count
 * @returns {Promise}
 */
RecommendationsModel.prototype.getArticlesIds = function(count) {
    return di.articlesModel.getRandomIds(count);
};

module.exports = RecommendationsModel;
