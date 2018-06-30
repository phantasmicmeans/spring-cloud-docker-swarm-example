const CommandFactory = require("../../lib/command/CommandFactory");
const CommandMetricsFactory = require("../../lib/metrics/CommandMetrics").Factory;
const CircuitBreakerFactory = require("../../lib/command/CircuitBreaker");

describe("CommandFactory", function () {
    beforeEach(function () {
        CommandFactory.resetCache();
        CommandMetricsFactory.resetCache();
    });

    it("should use the defaults set in HystrixConfig", function () {
        const command = CommandFactory.getOrCreate("TestConfig").build();
        expect(command.timeout).toBe(30000);
        expect(command.requestVolumeRejectionThreshold).toBe(0);

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestConfig"});
        expect(metrics.rollingCount.windowLength).toBe(10000);
        expect(metrics.rollingCount.numberOfBuckets).toBe(10);
        expect(metrics.percentileCount.windowLength).toBe(10000);
        expect(metrics.percentileCount.numberOfBuckets).toBe(10);

        const cb = CircuitBreakerFactory.getOrCreate({commandKey: "TestConfig"});
        expect(cb.circuitBreakerSleepWindowInMilliseconds).toBe(3000);
        expect(cb.circuitBreakerErrorThresholdPercentage).toBe(50);
        expect(cb.circuitBreakerForceClosed).toBeFalsy();
        expect(cb.circuitBreakerForceOpened).toBeFalsy();
        expect(cb.circuitBreakerRequestVolumeThresholdValue).toBe(10);
    });

    it("should override the defaults set in builder", function () {
        const command = CommandFactory
            .getOrCreate("TestCustomConfig")
            .timeout(3000)
            .statisticalWindowLength(10)
            .statisticalWindowNumberOfBuckets(1)
            .percentileWindowLength(20)
            .percentileWindowNumberOfBuckets(2)
            .circuitBreakerErrorThresholdPercentage(60)
            .circuitBreakerForceClosed(true)
            .circuitBreakerForceOpened(true)
            .circuitBreakerRequestVolumeThreshold(0)
            .circuitBreakerSleepWindowInMilliseconds(1000)
            .requestVolumeRejectionThreshold(100)
            .build();
        expect(command.timeout).toBe(3000);
        expect(command.requestVolumeRejectionThreshold).toBe(100);

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCustomConfig"});
        expect(metrics.rollingCount.windowLength).toBe(10);
        expect(metrics.rollingCount.numberOfBuckets).toBe(1);
        expect(metrics.percentileCount.windowLength).toBe(20);
        expect(metrics.percentileCount.numberOfBuckets).toBe(2);

        const cb = CircuitBreakerFactory.getOrCreate({commandKey: "TestCustomConfig"});
        expect(cb.circuitBreakerSleepWindowInMilliseconds).toBe(1000);
        expect(cb.circuitBreakerErrorThresholdPercentage).toBe(60);
        expect(cb.circuitBreakerForceClosed).toBeTruthy();
        expect(cb.circuitBreakerForceOpened).toBeTruthy();
        expect(cb.circuitBreakerRequestVolumeThresholdValue).toBe(0);
    });

    it("should pass correct config to command for circuit and metrics to recreate them after reset", function () {
        const command = CommandFactory
            .getOrCreate("TestCustomConfig")
            .timeout(3000)
            .statisticalWindowLength(10)
            .statisticalWindowNumberOfBuckets(1)
            .percentileWindowLength(20)
            .percentileWindowNumberOfBuckets(2)
            .circuitBreakerErrorThresholdPercentage(60)
            .circuitBreakerForceClosed(true)
            .circuitBreakerForceOpened(true)
            .circuitBreakerRequestVolumeThreshold(0)
            .circuitBreakerSleepWindowInMilliseconds(1000)
            .requestVolumeRejectionThreshold(100)
            .build();
        expect(command.timeout).toBe(3000);

        CommandMetricsFactory.resetCache();
        CircuitBreakerFactory.resetCache();

        const metrics = command.metrics;
        expect(metrics.rollingCount.windowLength).toBe(10);
        expect(metrics.rollingCount.numberOfBuckets).toBe(1);
        expect(metrics.percentileCount.windowLength).toBe(20);
        expect(metrics.percentileCount.numberOfBuckets).toBe(2);

        const cb = command.circuitBreaker;
        expect(cb.circuitBreakerSleepWindowInMilliseconds).toBe(1000);
        expect(cb.circuitBreakerErrorThresholdPercentage).toBe(60);
        expect(cb.circuitBreakerForceClosed).toBeTruthy();
        expect(cb.circuitBreakerForceOpened).toBeTruthy();
        expect(cb.circuitBreakerRequestVolumeThresholdValue).toBe(0);
    })

});