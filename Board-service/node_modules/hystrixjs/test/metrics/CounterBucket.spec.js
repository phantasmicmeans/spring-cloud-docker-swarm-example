'use strict';

const Bucket = require("../../lib/metrics/CounterBucket");
const RollingNumberEvent = require("../../lib/metrics/RollingNumberEvent");

describe("CounterBucket", function () {
    let underTest;

    beforeEach(function () {
        underTest = new Bucket(5000);
    });

    it("should increment value for a valid event", function () {
        underTest.increment(RollingNumberEvent.SUCCESS);
        expect(underTest.get(RollingNumberEvent.SUCCESS)).toBe(1);
        underTest.increment(RollingNumberEvent.SUCCESS);
        expect(underTest.get(RollingNumberEvent.SUCCESS)).toBe(2);
    });

    it("should return 0, if event was not recorded yet", function () {
        expect(underTest.get(RollingNumberEvent.FAILURE)).toBe(0);
    });

    it("should throw exception, if an invalid event is passed", function () {
        expect(function () {
            underTest.get("invalid")
        }).toThrowError();
        expect(function () {
            underTest.increment("invalid")
        }).toThrowError();
    })
});