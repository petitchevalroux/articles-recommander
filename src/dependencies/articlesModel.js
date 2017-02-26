"use strict";
var path = require("path");
var ArticlesModel = require(path.join(__dirname, "..", "models", "articles"));
module.exports = new ArticlesModel();
