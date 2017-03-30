"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));

di.articlesStatsModel
    .update()
    .then(function(updated) {
        di.log.info("%d articles' display statistics updated", updated.display);
        di.redis.quit();
        return updated;
    })
    .catch(function(error) {
        di.log.error(new di.Error(error));
    });
