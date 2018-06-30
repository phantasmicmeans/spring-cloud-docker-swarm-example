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

var _utilActualTime = require("../util/ActualTime");

var _utilActualTime2 = _interopRequireDefault(_utilActualTime);

var _utilHystrixConfig = require("../util/HystrixConfig");

var _utilHystrixConfig2 = _interopRequireDefault(_utilHystrixConfig);

function doFinally(promise, fn) {
    return promise.then(function (res) {
        fn();
        return res;
    }, function (err) {
        fn();
        throw err;
    });
}

function timeout(runWrapper, timeMs) {

    return new _utilHystrixConfig2["default"].promiseImplementation(function (resolve, reject) {
        var timer = setTimeout(function () {
            return reject(new Error('CommandTimeOut'));
        }, timeMs);

        return doFinally(runWrapper().then(resolve, reject), function () {
            return clearTimeout(timer);
        });
    });
}

var Command = (function () {
    function Command(_ref) {
        var _this = this;

        var commandKey = _ref.commandKey;
        var commandGroup = _ref.commandGroup;
        var runContext = _ref.runContext;
        var metricsConfig = _ref.metricsConfig;
        var circuitConfig = _ref.circuitConfig;
        var _ref$requestVolumeRejectionThreshold = _ref.requestVolumeRejectionThreshold;
        var requestVolumeRejectionThreshold = _ref$requestVolumeRejectionThreshold === undefined ? _utilHystrixConfig2["default"].requestVolumeRejectionThreshold : _ref$requestVolumeRejectionThreshold;
        var _ref$timeout = _ref.timeout;
        var timeout = _ref$timeout === undefined ? _utilHystrixConfig2["default"].executionTimeoutInMilliseconds : _ref$timeout;
        var _ref$fallback = _ref.fallback;
        var fallback = _ref$fallback === undefined ? function (err, args) {
            return _this.Promise.reject(err);
        } : _ref$fallback;
        var _ref$run = _ref.run;
        var run = _ref$run === undefined ? function () {
            throw new Error("Command must implement run method.");
        } : _ref$run;
        var _ref$isErrorHandler = _ref.isErrorHandler;
        var isErrorHandler = _ref$isErrorHandler === undefined ? function (error) {
            return error;
        } : _ref$isErrorHandler;

        _classCallCheck(this, Command);

        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.run = run;
        this.runContext = runContext;
        this.fallback = fallback;
        this.timeout = timeout;
        this.isError = isErrorHandler;
        this.metricsConfig = metricsConfig;
        this.circuitConfig = circuitConfig;
        this.requestVolumeRejectionThreshold = requestVolumeRejectionThreshold;
        this.Promise = _utilHystrixConfig2["default"].promiseImplementation;
    }

    _createClass(Command, [{
        key: "execute",
        value: function execute() {
            var _this2 = this,
                _arguments = arguments;

            //Resolve promise to guarantee execution/fallback is always deferred
            return this.Promise.resolve().then(function () {
                if (_this2.requestVolumeRejectionThreshold != 0 && _this2.metrics.getCurrentExecutionCount() >= _this2.requestVolumeRejectionThreshold) {
                    return _this2.handleFailure(new Error("CommandRejected"), Array.prototype.slice.call(_arguments));
                }
                if (_this2.circuitBreaker.allowRequest()) {
                    return _this2.runCommand.apply(_this2, _arguments);
                } else {
                    _this2.metrics.markShortCircuited();
                    return _this2.fallback(new Error("OpenCircuitError"), Array.prototype.slice.call(_arguments));
                }
            });
        }
    }, {
        key: "runCommand",
        value: function runCommand() {
            var _this3 = this,
                _arguments2 = arguments;

            this.metrics.incrementExecutionCount();
            var start = _utilActualTime2["default"].getCurrentTime();
            var args = arguments;
            var runWrapper = function runWrapper() {
                return _this3.run.apply(_this3.runContext, args);
            };
            var commandPromise = this.timeout > 0 ? timeout(runWrapper, this.timeout) : runWrapper();
            commandPromise = commandPromise.then(function (res) {
                _this3.handleSuccess(start);
                return res;
            })["catch"](function (err) {
                return _this3.handleFailure(err, Array.prototype.slice.call(_arguments2));
            });

            return doFinally(commandPromise, function () {
                return _this3.metrics.decrementExecutionCount();
            });
        }
    }, {
        key: "handleSuccess",
        value: function handleSuccess(start) {
            var end = _utilActualTime2["default"].getCurrentTime();
            this.metrics.addExecutionTime(end - start);
            this.metrics.markSuccess();
            this.circuitBreaker.markSuccess();
        }
    }, {
        key: "handleFailure",
        value: function handleFailure(err, args) {
            var _this4 = this;

            if (this.isError(err)) {
                if (err.message === "CommandTimeOut") {
                    this.metrics.markTimeout();
                } else if (err.message === "CommandRejected") {
                    this.metrics.markRejected();
                } else {
                    this.metrics.markFailure();
                }
            }

            return this.fallback(err, args).then(function (res) {
                _this4.metrics.markFallbackSuccess();
                return res;
            })["catch"](function (err) {
                _this4.metrics.markFallbackFailure();
                throw err;
            });
        }
    }, {
        key: "circuitBreaker",
        get: function get() {
            return _CircuitBreaker2["default"].getOrCreate(this.circuitConfig);
        }
    }, {
        key: "metrics",
        get: function get() {
            return _metricsCommandMetrics.Factory.getOrCreate(this.metricsConfig);
        }
    }]);

    return Command;
})();

exports["default"] = Command;
module.exports = exports["default"];