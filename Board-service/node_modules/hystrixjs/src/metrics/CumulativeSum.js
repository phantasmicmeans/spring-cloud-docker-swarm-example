import RollingNumberEvent from "./RollingNumberEvent";

class CumulativeSum {

    constructor() {
        this.values = {};
    }

    addBucket(lastBucket) {
        for (let type in RollingNumberEvent) {
            if (!this.values[type]) {
                this.values[type] = 0;
            }
            this.values[type] = this.values[type] + lastBucket.get(type);
        }
    }

    get(type) {
        if (RollingNumberEvent[type] === undefined) {
            throw new Error("invalid event");
        }
        return this.values[type] || 0;
    }
}

export default CumulativeSum;
