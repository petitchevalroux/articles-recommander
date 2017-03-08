/* eslint-env browser */
/* eslint no-console: 0 */
"use strict";

try {
    var cmd = window.artRec && window.artRec.cmd ? window.artRec.cmd : [];
    var Lib = require("./recommendations-library");
    window.artRec = new Lib();
    window.artRec.run(cmd);
} catch (e) {
    console.log("artrec error: " + e);
}
