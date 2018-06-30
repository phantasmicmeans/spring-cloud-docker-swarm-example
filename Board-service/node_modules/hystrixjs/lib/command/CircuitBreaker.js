"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilActualTime = require("../util/ActualTime");

var _utilActualTime2 = _interopRequireDefault(_utilActualTime);

var _metricsCommandMetrics = require("../metrics/CommandMetrics");

var _utilHystrixConfig = require("../util/HystrixConfig");

var _utilHystrixConfig2 = _interopRequireDefault(_utilHystrixConfig);

var CircuitBreaker = (function () {
    function CircuitBreaker(_ref) {
        var key = _ref.commandKey;
        var group = _ref.commandGroup;
        var _ref$circuitBreakerSleepWindowInMilliseconds = _ref.circuitBreakerSleepWindowInMilliseconds;
        var sleep = _ref$circuitBreakerSleepWindowInMilliseconds === undefined ? _utilHystrixConfig2["default"].circuitBreakerSleepWindowInMilliseconds : _ref$circuitBreakerSleepWindowInMilliseconds;
        var _ref$circuitBreakerErrorThresholdPercentage = _ref.circuitBreakerErrorThresholdPercentage;
        var errorThreshold = _ref$circuitBreakerErrorThresholdPercentage === undefined ? _utilHystrixConfig2["default"].circuitBreakerErrorThresholdPercentage : _ref$circuitBreakerErrorThresholdPercentage;
        var _ref$circuitBreakerRequestVolumeThreshold = _ref.circuitBreakerRequestVolumeThreshold;
        var volumeThreshold = _ref$circuitBreakerRequestVolumeThreshold === undefined ? _utilHystrixConfig2["default"].circuitBreakerRequestVolumeThreshold : _ref$circuitBreakerRequestVolumeThreshold;
        var _ref$circuitBreakerForceClosed = _ref.circuitBreakerForceClosed;
        var forceClosed = _ref$circuitBreakerForceClosed === undefined ? _utilHystrixConfig2["default"].circuitBreakerForceClosed : _ref$circuitBreakerForceClosed;
        var _ref$circuitBreakerForceOpened = _ref.circuitBreakerForceOpened;
        var forceOpened = _ref$circuitBreakerForceOpened === undefined ? _utilHystrixConfig2["default"].circuitBreakerForceOpened : _ref$circuitBreakerForceOpened;

        _classCallCheck(this, CircuitBreaker);

        this.circuitBreakerSleepWindowInMilliseconds = sleep;
        this.commandKey = key;
        this.commandGroup = group;
        this.circuitBreakerRequestVolumeThresholdValue = volumeThreshold;
        this.circuitBreakerErrorThresholdPercentage = errorThreshold;
        this.circuitOpen = false;
        this.circuitOpenedOrLastTestedTime = _utilActualTime2["default"].getCurrentTime();
        this.circuitBreakerForceClosed = forceClosed;
        this.circuitBreakerForceOpened = forceOpened;
    }

    _createClass(CircuitBreaker, [{
        key: "allowRequest",
        value: function allowRequest() {
            if (this.circuitBreakerForceOpened) {
                return false;
            }

            if (this.circuitBreakerForceClosed) {
                return true;
            }
            return !this.isOpen() || this.allowSingleTest();
        }
    }, {
        key: "allowSingleTest",
        value: function allowSingleTest() {
            if (this.circuitOpen && _utilActualTime2["default"].getCurrentTime() > this.circuitOpenedOrLastTestedTime + this.circuitBreakerSleepWindowInMilliseconds) {
                this.circuitOpenedOrLastTestedTime = _utilActualTime2["default"].getCurrentTime();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "isOpen",
        value: function isOpen() {
            if (this.circuitOpen) {
                return true;
            }

            var _metrics$getHealthCounts = this.metrics.getHealthCounts();

            var _metrics$getHealthCounts$totalCount = _metrics$getHealthCounts.totalCount;
            var totalCount = _metrics$getHealthCounts$totalCount === undefined ? 0 : _metrics$getHealthCounts$totalCount;
            var errorCount = _metrics$getHealthCounts.errorCount;
            var errorPercentage = _metrics$getHealthCounts.errorPercentage;

            if (totalCount < this.circuitBreakerRequestVolumeThreshold) {
                return false;
            }

            if (errorPercentage > this.circuitBreakerErrorThresholdPercentage) {
                this.circuitOpen = true;
                this.circuitOpenedOrLastTestedTime = _utilActualTime2["default"].getCurrentTime();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "markSuccess",
        value: function markSuccess() {
            if (this.circuitOpen) {
                this.circuitOpen = false;
                this.metrics.reset();
            }
        }
    }, {
        key: "metrics",
        get: function get() {
            return _metricsCommandMetrics.Factory.getOrCreate({ commandKey: this.commandKey });
        }
    }, {
        key: "circuitBreakerRequestVolumeThreshold",
        get: function get() {
            if (_utilHystrixConfig2["default"].circuitBreakerRequestVolumeThresholdForceOverride) {
                return _utilHystrixConfig2["default"].circuitBreakerRequestVolumeThresholdOverride;
            } else {
                return this.circuitBreakerRequestVolumeThresholdValue;
            }
        }
    }]);

    return CircuitBreaker;
})();

var circuitBreakersByCommand = new Map();

var Factory = (function () {
    function Factory() {
        _classCallCheck(this, Factory);
    }

    _createClass(Factory, null, [{
        key: "getOrCreate",
        value: function getOrCreate() {
            var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            var circuitBreakerSleepWindowInMilliseconds = _ref2.circuitBreakerSleepWindowInMilliseconds;
            var commandKey = _ref2.commandKey;
            var circuitBreakerErrorThresholdPercentage = _ref2.circuitBreakerErrorThresholdPercentage;
            var circuitBreakerRequestVolumeThreshold = _ref2.circuitBreakerRequestVolumeThreshold;
            var _ref2$commandGroup = _ref2.commandGroup;
            var commandGroup = _ref2$commandGroup === undefined ? "hystrix" : _ref2$commandGroup;
            var circuitBreakerForceClosed = _ref2.circuitBreakerForceClosed;
            var circuitBreakerForceOpened = _ref2.circuitBreakerForceOpened;

            var previouslyCached = circuitBreakersByCommand.get(commandKey);
            if (previouslyCached) {
                return previouslyCached;
            }

            var circuitBreaker = new CircuitBreaker({
                circuitBreakerSleepWindowInMilliseconds: circuitBreakerSleepWindowInMilliseconds,
                commandKey: commandKey,
                circuitBreakerErrorThresholdPercentage: circuitBreakerErrorThresholdPercentage,
                circuitBreakerRequestVolumeThreshold: circuitBreakerRequestVolumeThreshold,
                commandGroup: commandGroup,
                circuitBreakerForceClosed: circuitBreakerForceClosed,
                circuitBreakerForceOpened: circuitBreakerForceOpened
            });
            circuitBreakersByCommand.set(commandKey, circuitBreaker);
            return circuitBreakersByCommand.get(commandKey);
        }
    }, {
        key: "getCache",
        value: function getCache() {
            return circuitBreakersByCommand;
        }
    }, {
        key: "resetCache",
        value: function resetCache() {
            circuitBreakersByCommand.clear();
        }
    }]);

    return Factory;
})();

exports["default"] = Factory;
module.exports = exports["default"];