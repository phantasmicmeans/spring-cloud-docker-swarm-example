"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _RollingNumberEvent = require("./RollingNumberEvent");

var _RollingNumberEvent2 = _interopRequireDefault(_RollingNumberEvent);

var CounterBucket = (function () {
    function CounterBucket(windowStart) {
        _classCallCheck(this, CounterBucket);

        this.windowStart = windowStart;
        this.bucketValues = {};
    }

    _createClass(CounterBucket, [{
        key: "get",
        value: function get(type) {
            if (_RollingNumberEvent2["default"][type] === undefined) {
                throw new Error("invalid event");
            }

            if (!this.bucketValues[type]) {
                this.bucketValues[type] = 0;
            }
            return this.bucketValues[type];
        }
    }, {
        key: "increment",
        value: function increment(type) {
            if (_RollingNumberEvent2["default"][type] === undefined) {
                throw new Error("invalid event");
            }

            var value = this.bucketValues[type];
            if (value) {
                value = value + 1;
                this.bucketValues[type] = value;
            } else {
                this.bucketValues[type] = 1;
            }
        }
    }]);

    return CounterBucket;
})();

exports["default"] = CounterBucket;
module.exports = exports["default"];