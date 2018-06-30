import RollingNumberEvent from "./RollingNumberEvent";

export default class CounterBucket {

    constructor (windowStart) {
        this.windowStart = windowStart;
        this.bucketValues = {};
    }

    get(type) {
        if (RollingNumberEvent[type] === undefined) {
            throw new Error("invalid event");
        }

        if (!this.bucketValues[type]) {
            this.bucketValues[type] = 0;
        }
        return this.bucketValues[type];
    }

    increment(type) {
        if (RollingNumberEvent[type] === undefined) {
            throw new Error("invalid event");
        }

        let value = this.bucketValues[type];
        if (value) {
            value = value + 1;
            this.bucketValues[type] = value;
        } else {
            this.bucketValues[type] = 1;
        }
    }
}