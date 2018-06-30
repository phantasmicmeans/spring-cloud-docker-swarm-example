"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _metricsCommandMetrics = require("../metrics/CommandMetrics");

var _commandCircuitBreaker = require("../command/CircuitBreaker");

var _commandCircuitBreaker2 = _interopRequireDefault(_commandCircuitBreaker);

var _utilActualTime = require("../util/ActualTime");

var _utilActualTime2 = _interopRequireDefault(_utilActualTime);

var _metricsRollingNumberEvent = require("../metrics/RollingNumberEvent");

var _metricsRollingNumberEvent2 = _interopRequireDefault(_metricsRollingNumberEvent);

var _utilRequireFirst = require("../util/requireFirst");

var _utilRequireFirst2 = _interopRequireDefault(_utilRequireFirst);

var rx = (0, _utilRequireFirst2["default"])(["rxjs", "rx"], "HystrixSSEStream requires either rx@>=3.0.0 or rxjs@^5.0.0");

var HystrixSSEStream = (function () {
    function HystrixSSEStream() {
        _classCallCheck(this, HystrixSSEStream);
    }

    _createClass(HystrixSSEStream, null, [{
        key: "toObservable",
        value: function toObservable() {
            var interval = arguments.length <= 0 || arguments[0] === undefined ? 2000 : arguments[0];
            var scheduler = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

            var observableMetrics = rx.Observable.interval(interval, scheduler).flatMap(function () {
                return rx.Observable.from(_metricsCommandMetrics.Factory.getAllMetrics());
            }).map(function (metrics) {
                return HystrixSSEStream.toCommandJson(metrics);
            });

            return observableMetrics;
        }
    }, {
        key: "toCommandJson",
        value: function toCommandJson(metrics) {
            metrics.update();
            var json = {};
            json.type = "HystrixCommand";
            json.name = metrics.commandKey;
            json.group = metrics.commandGroup;
            json.currentTime = _utilActualTime2["default"].getCurrentTime();

            var circuitBreaker = _commandCircuitBreaker2["default"].getOrCreate({ commandKey: metrics.commandKey });
            json.isCircuitBreakerOpen = circuitBreaker.isOpen();

            var _metrics$getHealthCounts = metrics.getHealthCounts();

            var totalCount = _metrics$getHealthCounts.totalCount;
            var errorCount = _metrics$getHealthCounts.errorCount;
            var errorPercentage = _metrics$getHealthCounts.errorPercentage;

            json.errorPercentage = errorPercentage;
            json.errorCount = errorCount;
            json.requestCount = totalCount;

            json.rollingCountFailure = metrics.getRollingCount(_metricsRollingNumberEvent2["default"].FAILURE);
            json.rollingCountTimeout = metrics.getRollingCount(_metricsRollingNumberEvent2["default"].TIMEOUT);
            json.rollingCountSuccess = metrics.getRollingCount(_metricsRollingNumberEvent2["default"].SUCCESS);
            json.rollingCountShortCircuited = metrics.getRollingCount(_metricsRollingNumberEvent2["default"].SHORT_CIRCUITED);
            json.rollingCountBadRequests = json.rollingCountFailure;
            json.rollingCountCollapsedRequests = 0;
            json.rollingCountExceptionsThrown = 0;
            json.rollingCountFallbackFailure = 0;
            json.rollingCountFallbackRejection = 0;
            json.rollingCountFallbackSuccess = 0;
            json.rollingCountResponsesFromCache = 0;
            json.rollingCountSemaphoreRejected = 0;
            json.rollingCountThreadPoolRejected = 0;
            json.currentConcurrentExecutionCount = metrics.getCurrentExecutionCount();

            json.latencyExecute_mean = metrics.getExecutionTime("mean") || 0;
            json.latencyExecute = {};
            json.latencyExecute["0"] = metrics.getExecutionTime(0) || 0;
            json.latencyExecute["25"] = metrics.getExecutionTime(25) || 0;
            json.latencyExecute["50"] = metrics.getExecutionTime(50) || 0;
            json.latencyExecute["75"] = metrics.getExecutionTime(75) || 0;
            json.latencyExecute["90"] = metrics.getExecutionTime(90) || 0;
            json.latencyExecute["95"] = metrics.getExecutionTime(95) || 0;
            json.latencyExecute["99"] = metrics.getExecutionTime(99) || 0;
            json.latencyExecute["99.5"] = metrics.getExecutionTime(99.5) || 0;
            json.latencyExecute["100"] = metrics.getExecutionTime(100) || 0;

            json.latencyTotal_mean = metrics.getExecutionTime("mean") || 0;
            json.latencyTotal = {};
            json.latencyTotal["0"] = metrics.getExecutionTime(0) || 0;
            json.latencyTotal["25"] = metrics.getExecutionTime(25) || 0;
            json.latencyTotal["50"] = metrics.getExecutionTime(50) || 0;
            json.latencyTotal["75"] = metrics.getExecutionTime(75) || 0;
            json.latencyTotal["90"] = metrics.getExecutionTime(90) || 0;
            json.latencyTotal["95"] = metrics.getExecutionTime(95) || 0;
            json.latencyTotal["99"] = metrics.getExecutionTime(99) || 0;
            json.latencyTotal["99.5"] = metrics.getExecutionTime(99.5) || 0;
            json.latencyTotal["100"] = metrics.getExecutionTime(100) || 0;

            json.propertyValue_circuitBreakerRequestVolumeThreshold = circuitBreaker.circuitBreakerRequestVolumeThreshold;
            json.propertyValue_circuitBreakerSleepWindowInMilliseconds = circuitBreaker.circuitBreakerSleepWindowInMilliseconds;
            json.propertyValue_circuitBreakerErrorThresholdPercentage = circuitBreaker.circuitBreakerErrorThresholdPercentage;
            json.propertyValue_circuitBreakerForceOpen = false;
            json.propertyValue_circuitBreakerForceClosed = false;
            json.propertyValue_circuitBreakerEnabled = true;

            json.propertyValue_metricsRollingStatisticalWindowInMilliseconds = metrics.metricsRollingStatisticalWindowInMilliseconds;

            json.propertyValue_executionIsolationStrategy = "THREAD";
            json.propertyValue_executionIsolationStrategy = 'unknown';
            json.propertyValue_executionIsolationThreadTimeoutInMilliseconds = 0;
            json.propertyValue_executionIsolationThreadInterruptOnTimeout = 0;
            json.propertyValue_executionIsolationThreadPoolKeyOverride = false;
            json.propertyValue_executionIsolationSemaphoreMaxConcurrentRequests = 0;
            json.propertyValue_fallbackIsolationSemaphoreMaxConcurrentRequests = 0;

            json.propertyValue_requestCacheEnabled = false;
            json.propertyValue_requestLogEnabled = true;

            json.reportingHosts = 1;

            return JSON.stringify(json);
        }
    }]);

    return HystrixSSEStream;
})();

exports["default"] = HystrixSSEStream;
module.exports = exports["default"];