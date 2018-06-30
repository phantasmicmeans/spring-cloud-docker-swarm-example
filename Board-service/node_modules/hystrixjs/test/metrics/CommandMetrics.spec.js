'use strict';

const CommandMetrics = require("../../lib/metrics/CommandMetrics").CommandMetrics;
const RollingNumberEvent = require("../../lib/metrics/RollingNumberEvent");

describe("CommandMetrics", function() {
    let underTest;

    beforeEach(function() {
        underTest = new CommandMetrics("TestCommandMetrics", "defaultGroup");
    });

    it("should increment success counter on markSuccess calls", function() {
        underTest.markSuccess();
        expect(underTest.getRollingCount(RollingNumberEvent.SUCCESS)).toBe(1);
        underTest.markSuccess();
        underTest.markSuccess();
        expect(underTest.getRollingCount(RollingNumberEvent.SUCCESS)).toBe(3);
    });

    it("should increment failure counter on markFailure calls", function() {
        underTest.markFailure();
        expect(underTest.getRollingCount(RollingNumberEvent.FAILURE)).toBe(1);
        underTest.markFailure();
        underTest.markFailure();
        expect(underTest.getRollingCount(RollingNumberEvent.FAILURE)).toBe(3);
    });

    it("should increment timeout counter on markTimeout calls", function() {
        underTest.markTimeout();
        expect(underTest.getRollingCount(RollingNumberEvent.TIMEOUT)).toBe(1);
        underTest.markTimeout();
        underTest.markTimeout();
        expect(underTest.getRollingCount(RollingNumberEvent.TIMEOUT)).toBe(3);
    });

    it("should increment rejected counter on markRejected calls", function() {
        underTest.markRejected();
        expect(underTest.getRollingCount(RollingNumberEvent.REJECTED)).toBe(1);
        underTest.markRejected();
        underTest.markRejected();
        expect(underTest.getRollingCount(RollingNumberEvent.REJECTED)).toBe(3);
    });

    it("should increment short circuited counter on markShortCircuited calls", function() {
        underTest.markShortCircuited();
        expect(underTest.getRollingCount(RollingNumberEvent.SHORT_CIRCUITED)).toBe(1);
        underTest.markShortCircuited();
        underTest.markShortCircuited();
        expect(underTest.getRollingCount(RollingNumberEvent.SHORT_CIRCUITED)).toBe(3);
    });

    it("should increment successful fallback counter", function() {
        underTest.markFallbackSuccess();
        expect(underTest.getRollingCount(RollingNumberEvent.FALLBACK_SUCCESS)).toBe(1);
        underTest.markFallbackSuccess();
        underTest.markFallbackSuccess();
        expect(underTest.getRollingCount(RollingNumberEvent.FALLBACK_SUCCESS)).toBe(3);
    });

    it("should increment failed fallback counter", function() {
        underTest.markFallbackFailure();
        expect(underTest.getRollingCount(RollingNumberEvent.FALLBACK_FAILURE)).toBe(1);
        underTest.markFallbackFailure();
        underTest.markFallbackFailure();
        expect(underTest.getRollingCount(RollingNumberEvent.FALLBACK_FAILURE)).toBe(3);
    });

    it("should return the sum of all buckets in the window", function() {
        underTest.markTimeout();
        underTest.markTimeout();
        underTest.markTimeout();
        underTest.rollingCount.rollWindow();
        underTest.markTimeout();
        expect(underTest.getRollingCount(RollingNumberEvent.TIMEOUT)).toBe(4);
    });

    it("should return a correct execution time percentile", function() {
        underTest.addExecutionTime(1);
        underTest.addExecutionTime(11);
        underTest.percentileCount.rollWindow();
        expect(underTest.getExecutionTime(100)).toBe(11);
        expect(underTest.getExecutionTime("mean")).toBe(6);
    });

    it("should return 0 values as health counts initially", function(){
        expect(underTest.getHealthCounts().totalCount).toBe(0);
        expect(underTest.getHealthCounts().errorCount).toBe(0);
        expect(underTest.getHealthCounts().errorPercentage).toBe(0);
    });

    it("should return correct values as health counts", function(){

        underTest.markSuccess();
        underTest.markSuccess();
        underTest.markSuccess();

        underTest.markFailure();
        underTest.markFailure();
        underTest.markShortCircuited();
        underTest.markTimeout();
        underTest.markTimeout();
        underTest.markRejected();

        expect(underTest.getHealthCounts().totalCount).toBe(8);
        expect(underTest.getHealthCounts().errorCount).toBe(5);
        expect(underTest.getHealthCounts().errorPercentage).toBe(62);
    });

    it("should return correct values as health counts excluding fallback success/failures", function(){

        underTest.markSuccess();
        underTest.markSuccess();
        underTest.markSuccess();

        underTest.markFailure();
        underTest.markFailure();
        underTest.markShortCircuited();
        underTest.markTimeout();
        underTest.markTimeout();
        underTest.markRejected();

        underTest.markFallbackSuccess();
        underTest.markFallbackSuccess();
        underTest.markFallbackFailure();

        expect(underTest.getHealthCounts().totalCount).toBe(8);
        expect(underTest.getHealthCounts().errorCount).toBe(5);
        expect(underTest.getHealthCounts().errorPercentage).toBe(62);
    });

    it("should throw an error if no key is provided", function(){
        expect(function() {
            new CommandMetrics();
        }).toThrowError();
    });
});
