"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));

di.articlesStatsModel
    .update()
    .then(function(updated) {
        di.log.info("%d articles' display updated", updated.display);
        di.log.info("%d articles' quality updated", updated.quality);
        di.redis.quit();
        return updated;
    })
    .catch(function(error) {
        di.log.error(new di.Error(error));
    });
