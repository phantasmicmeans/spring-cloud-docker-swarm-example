let environment = process.env;
const customProperties = new Map();

let HystrixPropertiesNames = {
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

let defaults = {
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
    "hystrix.promise.implementation": Promise,
};

class HystrixConfig {

    static get metricsPercentileWindowBuckets() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS);
    }

    static get circuitBreakerForceClosed() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED);
    }

    static get circuitBreakerForceOpened() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN);
    }

    static get circuitBreakerSleepWindowInMilliseconds() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS);
    }

    static get circuitBreakerErrorThresholdPercentage() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE);
    }

    static get circuitBreakerRequestVolumeThreshold() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD);
    }

    static get circuitBreakerRequestVolumeThresholdForceOverride() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD);
    }
    static get circuitBreakerRequestVolumeThresholdOverride() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE);
    }

    static get executionTimeoutInMilliseconds() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS);
    }

    static get metricsStatisticalWindowBuckets() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS);
    }

    static get metricsStatisticalWindowInMilliseconds() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS);
    }

    static get metricsPercentileWindowInMilliseconds() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS);
    }

    static get metricsPercentileWindowBuckets() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS);
    }

    static get requestVolumeRejectionThreshold() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD);
    }

    static get promiseImplementation() {
        return customProperties.get(HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION);
    }
    
    static resetProperties() {
        customProperties.clear();
    }
    
    static init(properties = {}) {
        if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE,
                properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_ERROR_THRESHOLD_PERCENTAGE]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS,
                properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_SLEEP_WINDOW_IN_MS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD,
                properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE,
                properties[HystrixPropertiesNames.HYSTRIX_CIRCUIT_VOLUME_THRESHOLD_OVERRIDE]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD,
                properties[HystrixPropertiesNames.HYSTRIX_FORCE_OVERRIDE_CIRCUIT_VOLUME_THRESHOLD]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS,
                properties[HystrixPropertiesNames.HYSTRIX_EXECUTION_TIMEOUT_IN_MS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED,
                properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_CLOSED]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN,
                properties[HystrixPropertiesNames.HYSTRIX_FORCE_CIRCUIT_OPEN]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS,
                properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_BUCKETS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS,
                properties[HystrixPropertiesNames.HYSTRIX_METRICS_PERCENTILE_WINDOW_IN_MS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS,
                properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_BUCKETS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS,
                properties[HystrixPropertiesNames.HYSTRIX_METRICS_STATISTICAL_WINDOW_IN_MS]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD,
                properties[HystrixPropertiesNames.HYSTRIX_REQUEST_VOLUME_REJECTION_THRESHOLD]
            )
        }

        if (properties[HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION] != undefined) {
            customProperties.set(HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION,
                properties[HystrixPropertiesNames.HYSTRIX_PROMISE_IMPLEMENTATION]
            )
        }
    }
}

HystrixConfig.init(defaults);

export default HystrixConfig;
