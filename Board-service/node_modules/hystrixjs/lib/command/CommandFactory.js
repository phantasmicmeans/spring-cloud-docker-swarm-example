"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _metricsCommandMetrics = require("../metrics/CommandMetrics");

var _CircuitBreaker = require("./CircuitBreaker");

var _CircuitBreaker2 = _interopRequireDefault(_CircuitBreaker);

var _Command = require("./Command");

var _Command2 = _interopRequireDefault(_Command);

var hystrixCommandsCache = new Map();

var CommandFactory = (function () {
    function CommandFactory() {
        _classCallCheck(this, CommandFactory);
    }

    _createClass(CommandFactory, null, [{
        key: "getOrCreate",
        value: function getOrCreate(commandKey, commandGroup) {
            return new CommandBuilder(commandKey, commandGroup);
        }
    }, {
        key: "resetCache",
        value: function resetCache() {
            hystrixCommandsCache.clear();
        }
    }]);

    return CommandFactory;
})();

exports["default"] = CommandFactory;

var CommandBuilder = (function () {
    function CommandBuilder(commandKey) {
        var commandGroup = arguments.length <= 1 || arguments[1] === undefined ? "hystrix" : arguments[1];

        _classCallCheck(this, CommandBuilder);

        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.config = {};
    }

    _createClass(CommandBuilder, [{
        key: "cleanup",
        value: function cleanup(value) {
            this.config.cleanup = value;
            return this;
        }
    }, {
        key: "circuitBreakerSleepWindowInMilliseconds",
        value: function circuitBreakerSleepWindowInMilliseconds(value) {
            this.config.circuitBreakerSleepWindowInMilliseconds = value;
            return this;
        }
    }, {
        key: "errorHandler",
        value: function errorHandler(value) {
            this.config.isErrorHandler = value;
            return this;
        }
    }, {
        key: "timeout",
        value: function timeout(value) {
            this.config.timeout = value;
            return this;
        }
    }, {
        key: "circuitBreakerRequestVolumeThreshold",
        value: function circuitBreakerRequestVolumeThreshold(value) {
            this.config.circuitBreakerRequestVolumeThreshold = value;
            return this;
        }
    }, {
        key: "requestVolumeRejectionThreshold",
        value: function requestVolumeRejectionThreshold(value) {
            this.config.requestVolumeRejectionThreshold = value;
            return this;
        }
    }, {
        key: "circuitBreakerForceOpened",
        value: function circuitBreakerForceOpened(value) {
            this.config.circuitBreakerForceOpened = value;
            return this;
        }
    }, {
        key: "circuitBreakerForceClosed",
        value: function circuitBreakerForceClosed(value) {
            this.config.circuitBreakerForceClosed = value;
            return this;
        }
    }, {
        key: "statisticalWindowNumberOfBuckets",
        value: function statisticalWindowNumberOfBuckets(value) {
            this.config.statisticalWindowNumberOfBuckets = value;
            return this;
        }
    }, {
        key: "statisticalWindowLength",
        value: function statisticalWindowLength(value) {
            this.config.statisticalWindowLength = value;
            return this;
        }
    }, {
        key: "percentileWindowNumberOfBuckets",
        value: function percentileWindowNumberOfBuckets(value) {
            this.config.percentileWindowNumberOfBuckets = value;
            return this;
        }
    }, {
        key: "percentileWindowLength",
        value: function percentileWindowLength(value) {
            this.config.percentileWindowLength = value;
            return this;
        }
    }, {
        key: "circuitBreakerErrorThresholdPercentage",
        value: function circuitBreakerErrorThresholdPercentage(value) {
            this.config.circuitBreakerErrorThresholdPercentage = value;
            return this;
        }
    }, {
        key: "run",
        value: function run(value) {
            this.config.run = value;
            return this;
        }
    }, {
        key: "context",
        value: function context(value) {
            this.config.context = value;
            return this;
        }
    }, {
        key: "fallbackTo",
        value: function fallbackTo(value) {
            this.config.fallback = value;
            return this;
        }
    }, {
        key: "build",
        value: function build() {

            var previouslyCached = hystrixCommandsCache.get(this.commandKey);
            if (previouslyCached) {
                return previouslyCached;
            }

            var metricsConfig = {
                commandKey: this.commandKey,
                commandGroup: this.commandGroup,
                statisticalWindowTimeInMilliSeconds: this.config.statisticalWindowLength,
                statisticalWindowNumberOfBuckets: this.config.statisticalWindowNumberOfBuckets,
                percentileWindowTimeInMilliSeconds: this.config.percentileWindowLength,
                percentileWindowNumberOfBuckets: this.config.percentileWindowNumberOfBuckets
            };
            var circuitConfig = {
                commandKey: this.commandKey,
                commandGroup: this.commandGroup,
                circuitBreakerSleepWindowInMilliseconds: this.config.circuitBreakerSleepWindowInMilliseconds,
                circuitBreakerErrorThresholdPercentage: this.config.circuitBreakerErrorThresholdPercentage,
                circuitBreakerRequestVolumeThreshold: this.config.circuitBreakerRequestVolumeThreshold,
                circuitBreakerForceClosed: this.config.circuitBreakerForceClosed,
                circuitBreakerForceOpened: this.config.circuitBreakerForceOpened
            };
            _metricsCommandMetrics.Factory.getOrCreate(metricsConfig);
            _CircuitBreaker2["default"].getOrCreate(circuitConfig);
            var command = new _Command2["default"]({
                commandKey: this.commandKey,
                commandGroup: this.commandGroup,
                runContext: this.config.context,
                timeout: this.config.timeout,
                fallback: this.config.fallback,
                run: this.config.run,
                isErrorHandler: this.config.isErrorHandler,
                metricsConfig: metricsConfig,
                circuitConfig: circuitConfig,
                requestVolumeRejectionThreshold: this.config.requestVolumeRejectionThreshold
            });

            hystrixCommandsCache.set(this.commandKey, command);
            return hystrixCommandsCache.get(this.commandKey);
        }
    }]);

    return CommandBuilder;
})();

module.exports = exports["default"];