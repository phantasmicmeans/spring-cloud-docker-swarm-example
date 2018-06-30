import ActualTime from "../util/ActualTime";
import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import HystrixConfig from "../util/HystrixConfig";

class CircuitBreaker {
    constructor({
            commandKey: key,
            commandGroup: group,
            circuitBreakerSleepWindowInMilliseconds: sleep = HystrixConfig.circuitBreakerSleepWindowInMilliseconds,
            circuitBreakerErrorThresholdPercentage: errorThreshold = HystrixConfig.circuitBreakerErrorThresholdPercentage,
            circuitBreakerRequestVolumeThreshold: volumeThreshold = HystrixConfig.circuitBreakerRequestVolumeThreshold,
            circuitBreakerForceClosed: forceClosed = HystrixConfig.circuitBreakerForceClosed,
            circuitBreakerForceOpened: forceOpened = HystrixConfig.circuitBreakerForceOpened,
        }) {
        this.circuitBreakerSleepWindowInMilliseconds = sleep;
        this.commandKey = key;
        this.commandGroup = group;
        this.circuitBreakerRequestVolumeThresholdValue = volumeThreshold;
        this.circuitBreakerErrorThresholdPercentage = errorThreshold;
        this.circuitOpen = false;
        this.circuitOpenedOrLastTestedTime = ActualTime.getCurrentTime();
        this.circuitBreakerForceClosed = forceClosed;
        this.circuitBreakerForceOpened = forceOpened;
    }

    allowRequest() {
        if (this.circuitBreakerForceOpened) {
            return false;
        }

        if (this.circuitBreakerForceClosed) {
            return true;
        }
        return !this.isOpen() || this.allowSingleTest();
    }

    get metrics() {
        return CommandMetricsFactory.getOrCreate({commandKey: this.commandKey});
    }

    get circuitBreakerRequestVolumeThreshold() {
        if (HystrixConfig.circuitBreakerRequestVolumeThresholdForceOverride) {
            return HystrixConfig.circuitBreakerRequestVolumeThresholdOverride;
        } else {
            return this.circuitBreakerRequestVolumeThresholdValue;
        }
    }

    allowSingleTest() {
        if (this.circuitOpen && ActualTime.getCurrentTime() > this.circuitOpenedOrLastTestedTime + this.circuitBreakerSleepWindowInMilliseconds) {
            this.circuitOpenedOrLastTestedTime = ActualTime.getCurrentTime();
            return true;
        } else {
            return false;
        }
    }

    isOpen() {
        if (this.circuitOpen) {
            return true;
        }

        let {totalCount = 0, errorCount , errorPercentage} = this.metrics.getHealthCounts();
        if (totalCount < this.circuitBreakerRequestVolumeThreshold) {
            return false;
        }

        if (errorPercentage > this.circuitBreakerErrorThresholdPercentage) {
            this.circuitOpen = true;
            this.circuitOpenedOrLastTestedTime = ActualTime.getCurrentTime();
            return true;
        } else {
            return false;
        }
    }

    markSuccess() {
        if (this.circuitOpen) {
            this.circuitOpen = false;
            this.metrics.reset();
        }
    }
}

const circuitBreakersByCommand = new Map();

export default class Factory {

    static getOrCreate({
            circuitBreakerSleepWindowInMilliseconds,
            commandKey,
            circuitBreakerErrorThresholdPercentage,
            circuitBreakerRequestVolumeThreshold,
            commandGroup = "hystrix",
            circuitBreakerForceClosed,
            circuitBreakerForceOpened,
        } = {}) {

        let previouslyCached = circuitBreakersByCommand.get(commandKey);
        if (previouslyCached) {
            return previouslyCached
        }

        let circuitBreaker = new CircuitBreaker({
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

    static getCache() {
        return circuitBreakersByCommand;
    }

    static resetCache() {
        circuitBreakersByCommand.clear();
    }
}