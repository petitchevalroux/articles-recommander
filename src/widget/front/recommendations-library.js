/* eslint-env browser */
"use strict";

var doT = require("dot");

function Library() {}

Library.prototype.slots = [];
Library.prototype.recommendationsCount = 0;
/**
 * Add slot to the current page
 * @param {string} target
 * @param {int} count
 * @returns {undefined}
 */
Library.prototype.addSlot = function(target, count, template) {
    this.recommendationsCount = this.recommendationsCount +
        Math.max(0, parseInt(count));
    this.slots.push({
        "target": target,
        "count": count,
        "template": template
    });
};
/**
 * Called from the page when slots has been defined
 * @returns {undefined}
 */
Library.prototype.start = function() {
    this.fetchRecommendations(document.location.href);
};
/**
 * Fetch recommendations from servers
 * @param {string} to url to fetch recommendations for
 * @returns {undefined}
 */
Library.prototype.fetchRecommendations = function(to) {
    var count = this.getRecommendationsCount();
    // Avoid to call recommendations with empty count
    if (!count) {
        return;
    }
    var script = document.createElement("script");
    script.setAttribute(
        "src",
        this.getRecommendationsUrl(
            to,
            count
        )
    );
    document.head.appendChild(script);
};
/**
 * Called when recommendations are available
 * @param {array} recommendations
 * @returns {undefined}
 */
Library.prototype.loadRecommendations = function(recommendations) {
    var start = 0;
    var self = this;
    this.slots.forEach(function(slot) {
        var slotRecommendations = [];
        while (slotRecommendations.length < slot.count) {
            var end = Math.min(start + slot.count,
                recommendations.length);
            recommendations.slice(start, end)
                .forEach(function(r) {
                    slotRecommendations.push(r);
                    start = (start + 1) %
                        recommendations.length;
                });
        }
        self.renderSlot(
            slot.target,
            self.getSlotTemplate(slot),
            slotRecommendations
        );
    });
};

/**
 * Return url to get recommendations from
 * @param {string} to
 * @param {int} count
 * @returns {String}
 */
Library.prototype.getRecommendationsUrl = function(to, count) {
    if (typeof(window.artRecGetRecommendationsUrl) === "function") {
        return window.artRecGetRecommendationsUrl(to, count);
    }
    return "/recommendations.js?" +
        "to=" + encodeURIComponent(to) +
        "&count=" + encodeURIComponent(count);
};
/**
 * Return current recommendations count
 * @returns {.recommendationsCount|Number}
 */
Library.prototype.getRecommendationsCount = function() {
    return this.recommendationsCount;
};

/**
 * Render a slot to a target 
 * @param {string} target element id to render in
 * @param {function} template doT template to render
 * @param {array} recommendations recommendations to render to
 * @returns {undefined}
 */
Library.prototype.renderSlot = function(target, template, recommendations) {
    document.getElementById(target)
        .innerHTML = template(recommendations);
};

/**
 * Return do template to render 
 * @param {object} slot
 * @returns {function}
 */
Library.prototype.getSlotTemplate = function(slot) {
    var tpl = "";
    if (!slot.template) {
        tpl = "<table>{{~it :recommendation:index}}<tr>" +
            "<td><a href=\"{{=recommendation.url}}\"><img src=\"{{=recommendation.image}}\"></a></td>" +
            "<td><a href=\"{{=recommendation.url}}\">{{=recommendation.title}}</a></td></tr>{{~}}</table>";
    } else {
        tpl = slot.template;
    }
    return doT.template(tpl);
};

module.exports = Library;
