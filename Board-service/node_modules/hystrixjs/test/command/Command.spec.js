'use strict';

const CommandFactory = require("../../lib/command/CommandFactory");
const q = require("q");
const CommandMetricsFactory = require("../../lib/metrics/CommandMetrics").Factory;
const failTest = require("../support").failTest;
const RollingNumberEvent = require("../../lib/metrics/RollingNumberEvent");
const HystrixConfig = require("../../lib/util/HystrixConfig");

describe("Command", function () {
    it("should resolve with expected results", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                resolve(arg);
            });
        };

        const command = CommandFactory.getOrCreate("TestCommand")
            .run(run)
            .build();

        expect(command).not.toBeUndefined();
        command.execute("success").then(function (result) {
            expect(result).toBe("success");
            const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommand"});
            expect(metrics.getHealthCounts().totalCount).toBe(1);
            expect(metrics.getHealthCounts().errorCount).toBe(0);
            done();
        })
    });

    it("should timeout if the function does not resolve within the configured timeout", function (done) {
        jasmine.clock().install();
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                setTimeout(function () {
                    resolve(arg);
                }, 12000);
                jasmine.clock().tick(10000);
            });
        };

        const command = CommandFactory.getOrCreate("TestCommandTimeout")
            .run(run)
            .timeout(10000)
            .build();

        expect(command).not.toBeUndefined();
        command.execute("success").catch(function (err) {
            expect(err.message).toBe("CommandTimeOut");
            const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandTimeout"});
            expect(metrics.getHealthCounts().totalCount).toBe(1);
            expect(metrics.getHealthCounts().errorCount).toBe(1);
            jasmine.clock().uninstall();
            done();
        })
    });

    it("should resolve with fallback if the run function fails", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                throw new Error("rejected")
            });
        };

        const command = CommandFactory.getOrCreate("TestCommandFallback")
            .run(run)
            .fallbackTo(function (err) {
                return q.resolve("fallback");
            })
            .build();

        command.execute("success").then(function (result) {
            expect(result).toBe("fallback");
            const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandFallback"});
            expect(metrics.getHealthCounts().totalCount).toBe(1);
            expect(metrics.getHealthCounts().errorCount).toBe(1);
            done();
        })
    });

    it("should resolve with fallback and record FALLBACK_SUCCESS event", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                throw new Error("rejected")
            });
        };

        const command = CommandFactory.getOrCreate("TestCommandFallbackSuccessEvent")
            .run(run)
            .fallbackTo(function (err) {
                return q.resolve("fallback");
            })
            .build();

        command.execute("success").then(function (result) {
            expect(result).toBe("fallback");
            const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandFallbackSuccessEvent"});
            expect(metrics.getCumulativeCount(RollingNumberEvent.FALLBACK_SUCCESS)).toBe(1);
            done();
        })
    });

    it("it should reject with error with fallback and record FALLBACK_FAILURE event when fallback fails", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                throw new Error("rejected")
            });
        };

        const command = CommandFactory.getOrCreate("TestCommandFallbackFailureEvent")
            .run(run)
            .fallbackTo(function (err) {
                return q.reject(new Error("fallback"));
            })
            .build();

        command.execute("success").catch(function (err) {
            expect(err.message).toBe("fallback");
            const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandFallbackFailureEvent"});
            expect(metrics.getCumulativeCount(RollingNumberEvent.FALLBACK_FAILURE)).toBe(1);
            done();
        })
    });

    it("should call the fallback fn with the error & execute arguments if the run function fails", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                throw new Error("rejected")
            });
        };

        const command = CommandFactory.getOrCreate("TestCommandFallback")
            .run(run)
            .fallbackTo(function (err, args) {
                expect(err).toBeDefined();
                expect(args).toEqual(["arg1", "arg2"]);
                return q.resolve("fallback");
            })
            .build();

        command.execute("arg1", "arg2").then(done);
    });

    it("should not execute the run command, if the circuit is open and the threshold is reached", function (done) {
        const object = {
            run: function () {
                return q.Promise(function (resolve, reject, notify) {
                    reject(new Error("error"));
                });
            }
        };

        spyOn(object, "run").and.callThrough();
        const command = CommandFactory.getOrCreate("TestCommandThreshold")
            .run(object.run)
            .fallbackTo(function (err) {
                return q.resolve("fallback");
            })
            .circuitBreakerErrorThresholdPercentage(10)
            .circuitBreakerRequestVolumeThreshold(3)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandThreshold"});
        metrics.markFailure();
        metrics.markFailure();
        metrics.markFailure();
        command.execute().then(function (result) {
            expect(result).toBe("fallback");
            expect(object.run).not.toHaveBeenCalled();
            done();
        });
    });

    it("should call the fallback fn with error and execute arguments, if the circuit is open", function (done) {
        const object = {
            run: function () {
                return q.Promise(function (resolve, reject, notify) {
                    reject(new Error("error"));
                });
            }
        };

        spyOn(object, "run").and.callThrough();
        const command = CommandFactory.getOrCreate("TestCommandThreshold")
            .run(object.run)
            .fallbackTo(function (err, args) {
                expect(err.message).toEqual("OpenCircuitError");
                expect(args).toEqual(["arg1", "arg2"]);
                return q.resolve("fallback");
            })
            .circuitBreakerErrorThresholdPercentage(10)
            .circuitBreakerRequestVolumeThreshold(3)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandThreshold"});
        metrics.markFailure();
        metrics.markFailure();
        metrics.markFailure();
        command.execute("arg1", "arg2").then(done);
    });

    it("should execute the run command, if the circuit volume threshold is not reached", function (done) {
        const object = {
            run: function () {
                return q.Promise(function (resolve, reject, notify) {
                    reject(new Error("error"));
                });
            }
        };

        spyOn(object, "run").and.callThrough();
        const command = CommandFactory.getOrCreate("TestCommandThresholdNotReached")
            .run(object.run)
            .fallbackTo(function (err) {
                return q.resolve("fallback");
            })
            .circuitBreakerErrorThresholdPercentage(10)
            .circuitBreakerRequestVolumeThreshold(3)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandThresholdNotReached"});
        metrics.markFailure();
        metrics.markFailure();
        command.execute().then(function (result) {
            expect(result).toBe("fallback");
            expect(object.run).toHaveBeenCalled();
            done();
        });
    });

    it("should return fallback and not mark failure, if the command failed but with expected error", function (done) {
        const command = CommandFactory.getOrCreate("TestCommandErrorHandler")
            .run(function () {
                return q.Promise(function (resolve, reject, notify) {
                    reject(new Error("custom-error"));
                });
            })
            .errorHandler(function (error) {
                if (error.message == "custom-error") {
                    return false;
                }
                return error;
            })
            .fallbackTo(function (err) {
                return q.resolve("fallback");
            })
            .circuitBreakerErrorThresholdPercentage(10)
            .circuitBreakerRequestVolumeThreshold(0)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "TestCommandErrorHandler"});
        command.execute().then(function (result) {
            expect(result).toBe("fallback");
            const errorCount = metrics.getHealthCounts().errorCount;
            expect(errorCount).toBe(0);
            done();
        });
    });

    it("should reject request immediately, if the request volume threshold is reached", function (done) {
        const run = function (arg) {
            return q.Promise(function (resolve, reject, notify) {
                resolve(arg);
            });
        };

        const command = CommandFactory.getOrCreate("VolumeThresholdCommand")
            .run(run)
            .requestVolumeRejectionThreshold(2)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "VolumeThresholdCommand"});
        metrics.incrementExecutionCount();
        metrics.incrementExecutionCount();
        command.execute("success")
            .then(failTest(done), function (error) {
                expect(error.message).toBe("CommandRejected");
                expect(metrics.getRollingCount(RollingNumberEvent.REJECTED)).toBe(1);
                done();
            });
    });

    it("should execute fallback, if the request volume threshold is reached", function (done) {
        const object = {
            run: function () {
                return q.Promise(function (resolve, reject, notify) {
                    reject(new Error("error"));
                });
            }
        };

        spyOn(object, "run").and.callThrough();
        const command = CommandFactory.getOrCreate("VolumeThresholdCommandFallback")
            .run(object.run)
            .fallbackTo(function (err, args) {
                expect(err.message).toBe('CommandRejected');
                expect(args).toEqual(['success']);
                return q.resolve("fallback");
            })
            .requestVolumeRejectionThreshold(2)
            .build();

        const metrics = CommandMetricsFactory.getOrCreate({commandKey: "VolumeThresholdCommandFallback"});
        metrics.incrementExecutionCount();
        metrics.incrementExecutionCount();
        command.execute("success").then(function (result) {
            expect(result).toBe("fallback");
            expect(metrics.getRollingCount(RollingNumberEvent.REJECTED)).toBe(1);
            expect(object.run).not.toHaveBeenCalled();
            done();
        }, failTest(done));
    });

    it("should resolve with q promise when registered", function (done) {
        const run = function (arg) {
            return q(arg)
        };

        HystrixConfig.init({"hystrix.promise.implementation": q.Promise});

        const command = CommandFactory.getOrCreate("QCommand")
            .run(run)
            .build();

        const promise = command.execute("success");
        expect(promise).toBe(q(promise));
        promise.then(done, failTest(done));
    });
});
