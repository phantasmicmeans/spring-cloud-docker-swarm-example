"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = requireFirst;

function requireFirst(modules, errorMessage) {
    for (var i = 0; i < modules.length; ++i) {
        try {
            return require(modules[i]);
        } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
                throw err;
            }
        }
    }
    throw new Error(errorMessage);
}

module.exports = exports["default"];