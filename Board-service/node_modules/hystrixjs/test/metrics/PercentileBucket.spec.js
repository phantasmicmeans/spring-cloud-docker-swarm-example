'use strict';

const Bucket = require("../../lib/metrics/PercentileBucket");

describe("PercentileBucket", function () {
    let underTest;

    beforeEach(function () {
        underTest = new Bucket(5000);
    });

    it("should add value to the bucket values", function () {
        underTest.addValue(1);
        expect(underTest.values).not.toBeUndefined();
        underTest.addValue(1);
        expect(underTest.values.length).toBe(2);
    });
});