"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilActualTime = require("../util/ActualTime");

var _utilActualTime2 = _interopRequireDefault(_utilActualTime);

var _utilHystrixConfig = require("../util/HystrixConfig");

var _utilHystrixConfig2 = _interopRequireDefault(_utilHystrixConfig);

var _CounterBucket = require("./CounterBucket");

var _CounterBucket2 = _interopRequireDefault(_CounterBucket);

var _CumulativeSum = require("./CumulativeSum");

var _CumulativeSum2 = _interopRequireDefault(_CumulativeSum);

var RollingNumber = (function () {
    function RollingNumber() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$timeInMillisecond = _ref.timeInMillisecond;
        var timeInMillisecond = _ref$timeInMillisecond === undefined ? _utilHystrixConfig2["default"].metricsStatisticalWindowInMilliseconds : _ref$timeInMillisecond;
        var _ref$numberOfBuckets = _ref.numberOfBuckets;
        var numberOfBuckets = _ref$numberOfBuckets === undefined ? _utilHystrixConfig2["default"].metricsStatisticalWindowBuckets : _ref$numberOfBuckets;

        _classCallCheck(this, RollingNumber);

        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.buckets = [];
        this.cumulativeSum = new _CumulativeSum2["default"]();
    }

    _createClass(RollingNumber, [{
        key: "increment",
        value: function increment(type) {
            this.getCurrentBucket().increment(type);
        }
    }, {
        key: "getCurrentBucket",
        value: function getCurrentBucket() {
            var currentTime = _utilActualTime2["default"].getCurrentTime();

            if (this.buckets.length === 0) {
                var newBucket = new _CounterBucket2["default"](currentTime);
                this.buckets.push(newBucket);
                return newBucket;
            }

            var currentBucket = this.buckets[this.buckets.length - 1];
            if (currentTime > currentBucket.windowStart + this.windowLength) {
                this.reset();
                return this.getCurrentBucket();
            }
            if (currentTime < currentBucket.windowStart + this.bucketSizeInMilliseconds) {
                return currentBucket;
            } else {
                this.rollWindow(currentTime);
                return this.getCurrentBucket();
            }
        }
    }, {
        key: "rollWindow",
        value: function rollWindow(currentTime) {
            var currentBucket = this.buckets[this.buckets.length - 1];
            if (currentBucket) {
                this.cumulativeSum.addBucket(currentBucket);
            }

            var newBucket = new _CounterBucket2["default"](currentTime);
            if (this.buckets.length == this.numberOfBuckets) {
                this.buckets.shift();
            }
            this.buckets.push(newBucket);
        }
    }, {
        key: "getRollingSum",
        value: function getRollingSum(type) {
            var sum = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.buckets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var bucket = _step.value;

                    sum += bucket.get(type);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                        _iterator["return"]();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return sum;
        }
    }, {
        key: "getCumulativeSum",
        value: function getCumulativeSum(type) {
            return this.getCurrentBucket().get(type) + this.cumulativeSum.get(type);
        }
    }, {
        key: "reset",
        value: function reset() {
            var currentBucket = this.buckets[this.buckets.length - 1];
            if (currentBucket) {
                this.cumulativeSum.addBucket(currentBucket);
            }
            this.buckets = [];
        }
    }, {
        key: "bucketSizeInMilliseconds",
        get: function get() {
            return this.windowLength / this.numberOfBuckets;
        }
    }]);

    return RollingNumber;
})();

exports["default"] = RollingNumber;
module.exports = exports["default"];