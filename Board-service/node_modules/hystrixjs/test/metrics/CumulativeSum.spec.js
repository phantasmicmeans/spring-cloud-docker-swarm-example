'use strict';

const Bucket = require("../../lib/metrics/CounterBucket");
const CumulativeSum = require("../../lib/metrics/CumulativeSum");
const RollingNumberEvent = require("../../lib/metrics/RollingNumberEvent");

describe("CumulativeSum", function () {
    const comulativeSum = new CumulativeSum();
    const bucket = new Bucket(5000);

    it("should accumulate value for a valid events", function () {
        bucket.increment(RollingNumberEvent.SUCCESS);
        bucket.increment(RollingNumberEvent.SUCCESS);

        comulativeSum.addBucket(bucket);
        expect(comulativeSum.get(RollingNumberEvent.SUCCESS)).toBe(2);
    });

    it("should return 0, if event was not recorded yet", function () {
        expect(comulativeSum.get(RollingNumberEvent.FAILURE)).toBe(0);
    });

    it("should throw exception, if an invalid event is passed", function () {
        expect(function () {
            comulativeSum.get("invalid")
        }).toThrowError();
    });
});
