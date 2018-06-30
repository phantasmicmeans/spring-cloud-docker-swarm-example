"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var environment = process.env;
var customProperties = new Map();

var HystrixPropertiesNames = {
    HYSTRIX_FORCE_CIRCUIT_OPEN: "hystrix.force.circuit.open",
    HYSTRIX_FORCE_CIRCUIT_CLOSED: "hystrix.force.circuit.closed",
    HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS: "hystrix.circuit.sleepWindowInMilliseconds",
    HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE: "hystrix.circuit.errorThresholdPercentage",
    HYSTRIX_CIRCUIT_VOLUME_THRESHOLD: "hystrix.circuit.volumeThreshold",
    HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD: "hystrix.circuit.volumeThreshold.forceOverride",
    HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE: "hystrix.circuit.volumeThreshold.override",
    HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD: "hystrix.request.volume.rejectionThreshold",
    HYSTRIX_EXECUTION_TIMEOUT_IN_MS: "hystrix.execution.timeoutInMilliseconds",
    HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS: "hystrix.metrics.statistical.window.timeInMilliseconds",
    HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS: "hystrix.metrics.statistical.window.bucketsNumber",
    HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS: "hystrix.metrics.percentile.window.timeInMilliseconds",
    HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS: "hystrix.metrics.percentile.window.bucketsNumber",
    HYSTRIX_PROMISE_IMPLEMENTATION: "hystrix.promise.implementation"
};

var defaults = {
    "hystrix.force.circuit.open": false,
    "hystrix.force.circuit.closed": false,
    "hystrix.circuit.sleepWindowInMilliseconds": 3000,
    "hystrix.circuit.errorThresholdPercentage": 50,
    "hystrix.circuit.volumeThreshold": 10,
    "hystrix.circuit.volumeThreshold.forceOverride": false,
    "hystrix.circuit.volumeThreshold.override": 20,
    "hystrix.execution.timeoutInMilliseconds": 30000,
    "hystrix.metrics.statistical.window.timeInMilliseconds": 10000,
    "hystrix.metrics.statistical.window.bucketsNumber": 10,
    "hystrix.metrics.percentile.window.timeInMilliseconds": 10000,
    "hystrix.metrics.percentile.window.bucketsNumber": 10,
    "hystrix.request.volume.rejectionThreshold": 0,
    "hystrix.promise.implementation": Promise
};

var HystrixConfig = (function () {
    function HystrixConfig() {
        _classCallCheck(this, HystrixConfig);
    }

    _createClass(HystrixConfig, null, [{
        key: "resetProperties",
        value: function resetProperties() {
            customProperties.clear();
        }
    }, {
        key: "init",
        value: function init() {
            var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE, properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS, properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD, properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE, properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD, properties[HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS, properties[HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED, properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN, properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS, properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS, properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS, properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS, properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD, properties[HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD]);
            }

            if (properties[HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION] != undefined) {
                customProperties.set(HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION, properties[HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION]);
            }
        }
    }, {
        key: "metricsPercentileWindowBuckets",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS);
        }
    }, {
        key: "circuitBreakerForceClosed",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED);
        }
    }, {
        key: "circuitBreakerForceOpened",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN);
        }
    }, {
        key: "circuitBreakerSleepWindowInMilliseconds",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS);
        }
    }, {
        key: "circuitBreakerErrorThresholdPercentage",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE);
        }
    }, {
        key: "circuitBreakerRequestVolumeThreshold",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD);
        }
    }, {
        key: "circuitBreakerRequestVolumeThresholdForceOverride",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD);
        }
    }, {
        key: "circuitBreakerRequestVolumeThresholdOverride",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE);
        }
    }, {
        key: "executionTimeoutInMilliseconds",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS);
        }
    }, {
        key: "metricsStatisticalWindowBuckets",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS);
        }
    }, {
        key: "metricsStatisticalWindowInMilliseconds",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS);
        }
    }, {
        key: "metricsPercentileWindowInMilliseconds",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS);
        }
    }, {
        key: "requestVolumeRejectionThreshold",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD);
        }
    }, {
        key: "promiseImplementation",
        get: function get() {
            return customProperties.get(HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION);
        }
    }]);

    return HystrixConfig;
})();

HystrixConfig.init(defaults);

exports["default"] = HystrixConfig;
module.exports = exports["default"];