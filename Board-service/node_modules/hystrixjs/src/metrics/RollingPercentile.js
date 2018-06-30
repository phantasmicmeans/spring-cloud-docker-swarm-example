import ActualTime from "../util/ActualTime";
import HystrixConfig from "../util/HystrixConfig";
import Bucket from "./PercentileBucket";
import {Stats} from "fast-stats";

export default class RollingPercentile {

    constructor({
                timeInMillisecond = HystrixConfig.metricsPercentileWindowInMilliseconds,
                numberOfBuckets = HystrixConfig.metricsPercentileWindowBuckets
            } = {}) {
        this.windowLength = timeInMillisecond;
        this.numberOfBuckets = numberOfBuckets;
        this.buckets = [];
        this.percentileSnapshot = new PercentileSnapshot();
    }

    get bucketSizeInMilliseconds() {
        return this.windowLength / this.numberOfBuckets;
    }

    addValue(value) {
        this.getCurrentBucket().addValue(value)
    }

    getPercentile(percentile) {
        return this.percentileSnapshot.getPercentile(percentile);
    }

    getCurrentBucket() {
        let currentTime = ActualTime.getCurrentTime();

        if (this.buckets.length === 0) {
            let newBucket = new Bucket(currentTime);
            this.buckets.push(newBucket);
            return newBucket;
        }

        let currentBucket = this.buckets[this.buckets.length-1];
        if (currentTime < (currentBucket.windowStart + this.bucketSizeInMilliseconds)) {
            return currentBucket;
        } else {
            this.rollWindow(currentTime);
            return this.getCurrentBucket();
        }
    }

    rollWindow(currentTime) {
        let newBucket = new Bucket(currentTime);
        if (this.buckets.length == this.numberOfBuckets) {
            this.buckets.shift();
        }
        this.percentileSnapshot = new PercentileSnapshot(this.buckets);
        this.buckets.push(newBucket);
    }
}

class PercentileSnapshot {
    constructor(allBuckets = []) {
        this.stats = new Stats();
        for (let bucket of allBuckets) {
            this.stats.push(bucket.values)
        }

        this.mean = this.stats.amean() || 0;
        this.p0 = this.stats.percentile(0) || 0;
        this.p5 = this.stats.percentile(5) || 0;
        this.p10 = this.stats.percentile(10) || 0;
        this.p25 = this.stats.percentile(25) || 0;
        this.p50 = this.stats.percentile(50) || 0;
        this.p75 = this.stats.percentile(75) || 0;
        this.p90 = this.stats.percentile(90) || 0;
        this.p95 = this.stats.percentile(95) || 0;
        this.p99 = this.stats.percentile(99) || 0;
        this.p995 = this.stats.percentile(99.5) || 0;
        this.p999 = this.stats.percentile(99.9) || 0;
        this.p100 = this.stats.percentile(100) || 0;

    }

    getPercentile(percentile = "mean") {
        if (percentile === "mean") {
            return this.mean;
        }

        switch (percentile) {
            case 0: return this.p0;
            case 5: return this.p5;
            case 10: return this.p10;
            case 25: return this.p25;
            case 50: return this.p50;
            case 75: return this.p75;
            case 90: return this.p90;
            case 95: return this.p95;
            case 99: return this.p99;
            case 99.5: return this.p995;
            case 99.9: return this.p999;
            case 100: return this.p100;
        }
    }
}