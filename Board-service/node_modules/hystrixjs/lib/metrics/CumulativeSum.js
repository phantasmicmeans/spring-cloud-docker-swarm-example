"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _RollingNumberEvent = require("./RollingNumberEvent");

var _RollingNumberEvent2 = _interopRequireDefault(_RollingNumberEvent);

var CumulativeSum = (function () {
    function CumulativeSum() {
        _classCallCheck(this, CumulativeSum);

        this.values = {};
    }

    _createClass(CumulativeSum, [{
        key: "addBucket",
        value: function addBucket(lastBucket) {
            for (var type in _RollingNumberEvent2["default"]) {
                if (!this.values[type]) {
                    this.values[type] = 0;
                }
                this.values[type] = this.values[type] + lastBucket.get(type);
            }
        }
    }, {
        key: "get",
        value: function get(type) {
            if (_RollingNumberEvent2["default"][type] === undefined) {
                throw new Error("invalid event");
            }
            return this.values[type] || 0;
        }
    }]);

    return CumulativeSum;
})();

exports["default"] = CumulativeSum;
module.exports = exports["default"];