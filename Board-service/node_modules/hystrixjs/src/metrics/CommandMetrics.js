import RollingNumber from "./RollingNumber";
import RollingPercentile from "./RollingPercentile";
import RollingNumberEvent from "./RollingNumberEvent";
import ActualTime from "../util/ActualTime";
import HystrixConfig from "../util/HystrixConfig";

export class CommandMetrics {
    constructor(commandKey, commandGroup = "hystrix", {
            statisticalWindowTimeInMilliSeconds = HystrixConfig.metricsStatisticalWindowInMilliseconds,
            statisticalWindowNumberOfBuckets = HystrixConfig.metricsStatisticalWindowBuckets,
            percentileWindowTimeInMilliSeconds  = HystrixConfig.metricsPercentileWindowInMilliseconds,
            percentileWindowNumberOfBuckets = HystrixConfig.metricsPercentileWindowBuckets
        } = {}) {

        if (!commandKey) {
            throw new Error("Please provide a unique command key for the metrics.");
        }
        this.currentExecutionCount = 0;
        this.metricsRollingStatisticalWindowInMilliseconds = statisticalWindowTimeInMilliSeconds;
        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.lastHealthCountsSnapshot = ActualTime.getCurrentTime();
        this.rollingCount = new RollingNumber({
            timeInMillisecond: statisticalWindowTimeInMilliSeconds,
            numberOfBuckets: statisticalWindowNumberOfBuckets
        });
        this.percentileCount = new RollingPercentile({
            timeInMillisecond: percentileWindowTimeInMilliSeconds,
            numberOfBuckets: percentileWindowNumberOfBuckets
        });
    }

    markSuccess() {
        this.rollingCount.increment(RollingNumberEvent.SUCCESS);
    }

    markRejected() {
        this.rollingCount.increment(RollingNumberEvent.REJECTED);
    }

    markFailure() {
        this.rollingCount.increment(RollingNumberEvent.FAILURE);
    }

    markTimeout() {
        this.rollingCount.increment(RollingNumberEvent.TIMEOUT);
    }

    markShortCircuited() {
        this.rollingCount.increment(RollingNumberEvent.SHORT_CIRCUITED);
    }

    markFallbackFailure() {
        this.rollingCount.increment(RollingNumberEvent.FALLBACK_FAILURE);
    }

    markFallbackSuccess() {
        this.rollingCount.increment(RollingNumberEvent.FALLBACK_SUCCESS);
    }

    incrementExecutionCount() {
        ++this.currentExecutionCount;
    }

    decrementExecutionCount() {
        --this.currentExecutionCount;
    }

    getCurrentExecutionCount() {
        return this.currentExecutionCount;
    }

    addExecutionTime(time) {
        this.percentileCount.addValue(time);
    }

    getRollingCount(type) {
        return this.rollingCount.getRollingSum(type);
    }

    getCumulativeCount(type) {
        return this.rollingCount.getCumulativeSum(type);
    }

    getExecutionTime(percentile) {
        return this.percentileCount.getPercentile(percentile);
    }

    getHealthCounts() {
        //TODO restrict calculation by time to avoid too frequent calls
        let success = this.rollingCount.getRollingSum(RollingNumberEvent.SUCCESS);
        let error = this.rollingCount.getRollingSum(RollingNumberEvent.FAILURE);
        let timeout = this.rollingCount.getRollingSum(RollingNumberEvent.TIMEOUT);
        let shortCircuited = this.rollingCount.getRollingSum(RollingNumberEvent.SHORT_CIRCUITED);

        let totalCount = success + error + timeout + shortCircuited;
        let errorCount = error + timeout + shortCircuited;

        let errorPercentage = 0;
        if (totalCount > 0) {
            errorPercentage = errorCount / totalCount * 100;
        }

        return {
            totalCount: totalCount,
            errorCount: errorCount,
            errorPercentage: parseInt(errorPercentage)
        }
    }

    update() {
        this.rollingCount.getCurrentBucket();
        this.percentileCount.getCurrentBucket();
    }

    reset() {
        this.rollingCount.reset();
        this.lastHealthCountsSnapshot = ActualTime.getCurrentTime();
    }
}

const metricsByCommand = new Map();
export class Factory {

    static getOrCreate({
            commandKey,
            commandGroup = "hystrix",
            statisticalWindowTimeInMilliSeconds,
            statisticalWindowNumberOfBuckets,
            percentileWindowTimeInMilliSeconds,
            percentileWindowNumberOfBuckets
        } = {}) {

        let previouslyCached = metricsByCommand.get(commandKey);
        if (previouslyCached) {
            return previouslyCached
        }

        let metrics = new CommandMetrics(commandKey, commandGroup, {
            statisticalWindowTimeInMilliSeconds: statisticalWindowTimeInMilliSeconds,
            statisticalWindowNumberOfBuckets: statisticalWindowNumberOfBuckets,
            percentileWindowTimeInMilliSeconds: percentileWindowTimeInMilliSeconds,
            percentileWindowNumberOfBuckets: percentileWindowNumberOfBuckets
        });
        metricsByCommand.set(commandKey, metrics);
        return metricsByCommand.get(commandKey);

    }

    static resetCache() {
        metricsByCommand.clear();
    }

    static getAllMetrics() {
        return metricsByCommand.values();
    }
}
