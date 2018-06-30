'use strict';

const CircuitBreakerFactory = require("../../lib/command/CircuitBreaker");
const CommandMetricsFactory = require("../../lib/metrics/CommandMetrics").Factory;
const CommandMetrics = require("../../lib/metrics/CommandMetrics").CommandMetrics;
const rewire = require("rewire");
const support = require("../support");

describe("CircuitBreaker", function () {

    beforeEach(function () {
        CommandMetricsFactory.resetCache();
        CircuitBreakerFactory.resetCache();
    });

    function getCBOptions(commandKey) {
        return {
            circuitBreakerSleepWindowInMilliseconds: 1000,
            commandKey: commandKey,
            circuitBreakerErrorThresholdPercentage: 10,
            circuitBreakerRequestVolumeThreshold: 0
        }
    }

    it("should cache instances in the factory", function () {
        let cb = CircuitBreakerFactory.getOrCreate(getCBOptions("Test"));
        expect(cb).not.toBeUndefined();
        expect(CircuitBreakerFactory.getCache().size).toBe(1);
        cb = CircuitBreakerFactory.getOrCreate(getCBOptions("AnotherTest"));
        expect(cb).not.toBeUndefined();
        expect(CircuitBreakerFactory.getCache().size).toBe(2);
    });

    it("should open circuit if error threshold is greater than error percentage", function () {
        const options = getCBOptions("Test");
        const cb = CircuitBreakerFactory.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.isOpen()).toBeTruthy();
    });

    it("should not open circuit if the volume has not reached threshold", function () {
        const options = getCBOptions("Test");
        options.circuitBreakerRequestVolumeThreshold = 3;
        const cb = CircuitBreakerFactory.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.isOpen()).toBeFalsy();

        metrics.markFailure();

        expect(cb.isOpen()).toBeTruthy();
    });

    it("should retry after a configured sleep time, if the circuit was open", function () {
        const options = getCBOptions("Test");
        const CircuitBreakerFactoryRewired = rewire("../../lib/command/CircuitBreaker");
        const cb = CircuitBreakerFactoryRewired.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.allowRequest()).toBeFalsy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 1001);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeTruthy();
    });

    it("should allow only one retry after configured sleep window", function () {
        const options = getCBOptions("Test");
        const CircuitBreakerFactoryRewired = rewire("../../lib/command/CircuitBreaker");
        const cb = CircuitBreakerFactoryRewired.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.allowRequest()).toBeFalsy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 1001);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeTruthy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 1201);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeFalsy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 1501);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeFalsy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 1701);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeFalsy();

        support.fastForwardActualTime(CircuitBreakerFactoryRewired, 2001);
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeTruthy();
    });

    it("should reset metrics after the circuit was closed again", function () {
        const options = getCBOptions("Test");
        const cb = CircuitBreakerFactory.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.allowRequest()).toBeFalsy();
        cb.markSuccess();
        expect(cb.allowRequest()).toBeTruthy();
    });

    it("should allow request, if the circuitBreakerForceClosed is set to true", function () {
        const options = getCBOptions("Test");
        options.circuitBreakerForceClosed = true;
        const cb = CircuitBreakerFactory.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        metrics.markFailure();
        expect(cb.isOpen()).toBeTruthy();
        expect(cb.allowRequest()).toBeTruthy();
    });

    it("should not allow request, if the circuitBreakerForceOpened is set to true", function () {
        const options = getCBOptions("Test");
        options.circuitBreakerForceOpened = true;
        const cb = CircuitBreakerFactory.getOrCreate(options);
        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "Test"});
        metrics.markSuccess();
        expect(cb.isOpen()).toBeFalsy();
        expect(cb.allowRequest()).toBeFalsy();
    });
});
