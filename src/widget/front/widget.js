/* eslint-env browser */
/* eslint no-console: 0 */
"use strict";

try {
    var slots = window.artRecSlots;
    var ArtRecLib = require("./recommendations-library");
    var lib = new ArtRecLib();
    slots.forEach(function(options) {
        lib.addSlot(options.target, options.count);
    });
    window.artRecLib = lib;
    window.artRecLib.start();
} catch (e) {
    console.log("artrec error: " + e);
}
