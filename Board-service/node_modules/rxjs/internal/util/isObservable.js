"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("../symbol/observable");
/** Identifies an input as being Observable (but not necessary an Rx Observable) */
function isObservable(input) {
    return input && typeof input[observable_1.observable] === 'function';
}
exports.isObservable = isObservable;
//# sourceMappingURL=isObservable.js.map