import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import CircuitBreakFactory from "../command/CircuitBreaker";
import ActualTime from "../util/ActualTime";
import RollingNumberEvent from "../metrics/RollingNumberEvent";
import requireFirst from "../util/requireFirst";

let rx = requireFirst(["rxjs", "rx"], "HystrixSSEStream requires either rx@>=3.0.0 or rxjs@^5.0.0");

export default class HystrixSSEStream {
    static toObservable(interval = 2000, scheduler = undefined) {
        let observableMetrics = rx.Observable
            .interval(interval, scheduler)
            .flatMap(() => {
                return rx.Observable.from(CommandMetricsFactory.getAllMetrics());
            })
            .map((metrics) => {
                return HystrixSSEStream.toCommandJson(metrics)
            });

        return observableMetrics;
    }

    static toCommandJson(metrics) {
        metrics.update();
        let json = {};
        json.type = "HystrixCommand";
        json.name = metrics.commandKey;
        json.group = metrics.commandGroup;
        json.currentTime = ActualTime.getCurrentTime();

        let circuitBreaker = CircuitBreakFactory.getOrCreate({commandKey: metrics.commandKey});
        json.isCircuitBreakerOpen = circuitBreaker.isOpen();

        let {totalCount, errorCount, errorPercentage} = metrics.getHealthCounts();
        json.errorPercentage = errorPercentage;
        json.errorCount = errorCount;
        json.requestCount = totalCount;

        json.rollingCountFailure = metrics.getRollingCount(RollingNumberEvent.FAILURE);
        json.rollingCountTimeout = metrics.getRollingCount(RollingNumberEvent.TIMEOUT);
        json.rollingCountSuccess = metrics.getRollingCount(RollingNumberEvent.SUCCESS);
        json.rollingCountShortCircuited = metrics.getRollingCount(RollingNumberEvent.SHORT_CIRCUITED);
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
}
