"use strict";
/* global RECOMMENDATIONS */
/* eslint-env browser */
/* eslint no-console: 0 */
/* eslint no-console: 0 */
(function artRecLoader(window) {
    try {
        window.artRecLib.loadRecommendations(RECOMMENDATIONS);
    } catch (e) {
        console.log("artrec error: " + e);
    }
})(window);
