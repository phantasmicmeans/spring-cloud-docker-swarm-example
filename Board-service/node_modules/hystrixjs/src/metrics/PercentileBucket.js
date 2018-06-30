import RollingNumberEvent from "./RollingNumberEvent";

export default class PercentileBucket {
    constructor (windowStart) {
        this.windowStart = windowStart;
        this.bucketValues = [];
    }

    addValue(value = 0) {
        this.bucketValues.push(value);
    }

    get values() {
        return this.bucketValues;
    }
}