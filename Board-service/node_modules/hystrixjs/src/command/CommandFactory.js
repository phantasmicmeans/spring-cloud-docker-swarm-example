import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import CircuitBreakerFactory from "./CircuitBreaker";
import Command from "./Command";

const hystrixCommandsCache = new Map();

export default class CommandFactory {

    static getOrCreate(commandKey, commandGroup) {
        return new CommandBuilder(commandKey, commandGroup);
    }

    static resetCache() {
        hystrixCommandsCache.clear();
    }
}

class CommandBuilder {
    constructor(commandKey, commandGroup = "hystrix") {
        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.config = {};
    }

    cleanup (value) {
        this.config.cleanup = value;
        return this;
    }
    circuitBreakerSleepWindowInMilliseconds (value) {
        this.config.circuitBreakerSleepWindowInMilliseconds = value;
        return this;
    }
    errorHandler (value) {
        this.config.isErrorHandler = value;
        return this;
    }
    timeout (value) {
        this.config.timeout = value;
        return this;
    }
    circuitBreakerRequestVolumeThreshold (value) {
        this.config.circuitBreakerRequestVolumeThreshold = value;
        return this;
    }
    requestVolumeRejectionThreshold (value) {
        this.config.requestVolumeRejectionThreshold = value;
        return this;
    }
    circuitBreakerForceOpened(value) {
        this.config.circuitBreakerForceOpened = value;
        return this;
    }
    circuitBreakerForceClosed(value) {
        this.config.circuitBreakerForceClosed = value;
        return this;
    }
    statisticalWindowNumberOfBuckets (value) {
        this.config.statisticalWindowNumberOfBuckets = value;
        return this;
    }
    statisticalWindowLength (value) {
        this.config.statisticalWindowLength = value;
        return this;
    }
    percentileWindowNumberOfBuckets (value) {
        this.config.percentileWindowNumberOfBuckets = value;
        return this;
    }
    percentileWindowLength (value) {
        this.config.percentileWindowLength = value;
        return this;
    }
    circuitBreakerErrorThresholdPercentage (value) {
        this.config.circuitBreakerErrorThresholdPercentage = value;
        return this;
    }
    run (value) {
        this.config.run = value;
        return this;
    }
    context (value) {
        this.config.context = value;
        return this;
    }
    fallbackTo (value) {
        this.config.fallback = value;
        return this;
    }
    build () {

        let previouslyCached = hystrixCommandsCache.get(this.commandKey);
        if (previouslyCached) {
            return previouslyCached
        }

        let metricsConfig = {
            commandKey: this.commandKey,
            commandGroup: this.commandGroup,
            statisticalWindowTimeInMilliSeconds: this.config.statisticalWindowLength,
            statisticalWindowNumberOfBuckets: this.config.statisticalWindowNumberOfBuckets,
            percentileWindowTimeInMilliSeconds: this.config.percentileWindowLength,
            percentileWindowNumberOfBuckets: this.config.percentileWindowNumberOfBuckets
        };
        let circuitConfig = {
            commandKey: this.commandKey,
            commandGroup: this.commandGroup,
            circuitBreakerSleepWindowInMilliseconds: this.config.circuitBreakerSleepWindowInMilliseconds,
            circuitBreakerErrorThresholdPercentage: this.config.circuitBreakerErrorThresholdPercentage,
            circuitBreakerRequestVolumeThreshold: this.config.circuitBreakerRequestVolumeThreshold,
            circuitBreakerForceClosed: this.config.circuitBreakerForceClosed,
            circuitBreakerForceOpened: this.config.circuitBreakerForceOpened
        };
        CommandMetricsFactory.getOrCreate(metricsConfig);
        CircuitBreakerFactory.getOrCreate(circuitConfig);
        let command = new Command({
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

}