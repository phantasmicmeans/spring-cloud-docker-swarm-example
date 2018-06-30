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

var _PercentileBucket = require("./PercentileBucket");

var _PercentileBucket2 = _interopRequireDefault(_PercentileBucket);

var _fastStats = require("fast-stats");

var RollingPercentile = (function () {
    function RollingPercentile() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$timeInMillisecond = _ref.timeInMillisecond;
        var timeInMillisecond = _ref$timeInMillisecond === undefined ? _utilHystrixConfig2["default"].metricsPercentileWindowInMilliseconds : _ref$timeInMillisecond;
        var _ref$numberOfBuckets = _ref.numberOfBuckets;
        var numberOfBuckets = _ref$numberOfBuckets === undefined ? _utilHystrixConfig2["default"].metricsPercentileWindowBuckets : _ref$numberOfBuckets;

        _classCallCheck(this, RollingPercentile);

        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.buckets = [];
        this.percentileSnapshot = new PercentileSnapshot();
    }

    _createClass(RollingPercentile, [{
        key: "addValue",
        value: function addValue(value) {
            this.getCurrentBucket().addValue(value);
        }
    }, {
        key: "getPercentile",
        value: function getPercentile(percentile) {
            return this.percentileSnapshot.getPercentile(percentile);
        }
    }, {
        key: "getCurrentBucket",
        value: function getCurrentBucket() {
            var currentTime = _utilActualTime2["default"].getCurrentTime();

            if (this.buckets.length === 0) {
                var newBucket = new _PercentileBucket2["default"](currentTime);
                this.buckets.push(newBucket);
                return newBucket;
            }

            var currentBucket = this.buckets[this.buckets.length - 1];
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
            var newBucket = new _PercentileBucket2["default"](currentTime);
            if (this.buckets.length == this.numberOfBuckets) {
                this.buckets.shift();
            }
            this.percentileSnapshot = new PercentileSnapshot(this.buckets);
            this.buckets.push(newBucket);
        }
    }, {
        key: "bucketSizeInMilliseconds",
        get: function get() {
            return this.windowLength / this.numberOfBuckets;
        }
    }]);

    return RollingPercentile;
})();

exports["default"] = RollingPercentile;

var PercentileSnapshot = (function () {
    function PercentileSnapshot() {
        var allBuckets = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, PercentileSnapshot);

        this.stats = new _fastStats.Stats();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = allBuckets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var bucket = _step.value;

                this.stats.push(bucket.values);
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

        this.mean = this.stats.amean() || 0;
        this.p0 = this.stats.percentile(0) || 0;
        this.p5 = this.stats.percentile(5) || 0;
        this.p10 = this.stats.percentile(10) || 0;
        this.p25 = this.stats.percentile(25) || 0;
        this.p50 = this.stats.percentile(50) || 0;
        this.p75 = this.stats.percentile(75) || 0;
        this.p90 = this.stats.percentile(90) || 0;
        this.p95 = this.stats.percentile(95) || 0;
        this.p99 = this.stats.percentile(99) || 0;
        this.p995 = this.stats.percentile(99.5) || 0;
        this.p999 = this.stats.percentile(99.9) || 0;
        this.p100 = this.stats.percentile(100) || 0;
    }

    _createClass(PercentileSnapshot, [{
        key: "getPercentile",
        value: function getPercentile() {
            var percentile = arguments.length <= 0 || arguments[0] === undefined ? "mean" : arguments[0];

            if (percentile === "mean") {
                return this.mean;
            }

            switch (percentile) {
                case 0:
                    return this.p0;
                case 5:
                    return this.p5;
                case 10:
                    return this.p10;
                case 25:
                    return this.p25;
                case 50:
                    return this.p50;
                case 75:
                    return this.p75;
                case 90:
                    return this.p90;
                case 95:
                    return this.p95;
                case 99:
                    return this.p99;
                case 99.5:
                    return this.p995;
                case 99.9:
                    return this.p999;
                case 100:
                    return this.p100;
            }
        }
    }]);

    return PercentileSnapshot;
})();

module.exports = exports["default"];