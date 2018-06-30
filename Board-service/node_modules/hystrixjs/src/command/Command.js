import {Factory as CommandMetricsFactory} from "../metrics/CommandMetrics";
import CircuitBreakerFactory from "./CircuitBreaker";
import ActualTime from "../util/ActualTime"
import HystrixConfig from "../util/HystrixConfig";

function doFinally(promise, fn) {
    return promise.then(
        res => {
            fn();
            return res;
        },
        err => {
            fn();
            throw err;
        }
    );
}

function timeout(runWrapper, timeMs) {

    return new HystrixConfig.promiseImplementation((resolve, reject) => {
        let timer = setTimeout(() => reject(new Error('CommandTimeOut')), timeMs);

        return doFinally(runWrapper().then(resolve, reject),
            () => clearTimeout(timer));
    });

}

export default class Command {
    constructor({
            commandKey,
            commandGroup,
            runContext,
            metricsConfig,
            circuitConfig,
            requestVolumeRejectionThreshold = HystrixConfig.requestVolumeRejectionThreshold,
            timeout = HystrixConfig.executionTimeoutInMilliseconds,
            fallback = (err, args) => { return this.Promise.reject(err) },
            run = function() {throw new Error("Command must implement run method.")},
            isErrorHandler = function(error) {return error;}
        }) {
        this.commandKey = commandKey;
        this.commandGroup = commandGroup;
        this.run = run;
        this.runContext = runContext;
        this.fallback = fallback;
        this.timeout = timeout;
        this.isError = isErrorHandler;
        this.metricsConfig = metricsConfig;
        this.circuitConfig = circuitConfig;
        this.requestVolumeRejectionThreshold = requestVolumeRejectionThreshold;
        this.Promise = HystrixConfig.promiseImplementation;
    }

    get circuitBreaker() {
        return CircuitBreakerFactory.getOrCreate(this.circuitConfig);
    }

    get metrics() {
        return CommandMetricsFactory.getOrCreate(this.metricsConfig);
    }

    execute() {
        //Resolve promise to guarantee execution/fallback is always deferred
        return this.Promise.resolve()
            .then(() => {
                if (this.requestVolumeRejectionThreshold != 0 && this.metrics.getCurrentExecutionCount() >= this.requestVolumeRejectionThreshold) {
                    return this.handleFailure(new Error("CommandRejected"), Array.prototype.slice.call(arguments));
                }
                if (this.circuitBreaker.allowRequest()) {
                    return this.runCommand.apply(this, arguments);
                } else {
                    this.metrics.markShortCircuited();
                    return this.fallback(new Error("OpenCircuitError"), Array.prototype.slice.call(arguments));
                }
            });
    }

    runCommand() {
        this.metrics.incrementExecutionCount();
        let start = ActualTime.getCurrentTime();
        const args = arguments;
        const runWrapper = () => this.run.apply(this.runContext, args);
        let commandPromise = this.timeout > 0 ? timeout(runWrapper, this.timeout) : runWrapper();
        commandPromise = commandPromise.then(
                (res) => {
                    this.handleSuccess(start);
                    return res
                }
            )
            .catch(err => this.handleFailure(err, Array.prototype.slice.call(arguments)));

        return doFinally(commandPromise, () => this.metrics.decrementExecutionCount());
    }

    handleSuccess(start) {
        let end = ActualTime.getCurrentTime();
        this.metrics.addExecutionTime(end - start);
        this.metrics.markSuccess();
        this.circuitBreaker.markSuccess();
    }

    handleFailure(err, args) {
        if (this.isError(err)) {
            if (err.message === "CommandTimeOut") {
                this.metrics.markTimeout();
            } else if (err.message === "CommandRejected") {
                this.metrics.markRejected();
            } else {
                this.metrics.markFailure();
            }
        }

        return this.fallback(err, args)
        .then(res => {
            this.metrics.markFallbackSuccess();
            return res;
        })
        .catch(err => {
            this.metrics.markFallbackFailure();
            throw err;
        });
    }
}
