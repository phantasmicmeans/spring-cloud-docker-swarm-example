'use strict';

const HystrixSSEStream = require('../../lib/http/HystrixSSEStream');
const CommandFactory = require('../../lib/command/CommandFactory');
const CommandMetricsFactory = require('../../lib/metrics/CommandMetrics').Factory;
const q = require('q');
const rx = require('rxjs');
const rewire = require('rewire');
const support = require("../support");
const sinon = require('sinon');

describe('HystrixSSEStream', function() {
    let testScheduler;

    function stubTime(milliseconds = 2000) {
        testScheduler = new rx.VirtualTimeScheduler(undefined, milliseconds);
    }

    beforeEach(function() {
        CommandFactory.resetCache();
        CommandMetricsFactory.resetCache();
    });

    function executeCommand(commandKey, timeout = 0) {
        const run = function(arg) {
            return q.Promise(function(resolve, reject, notify) {
                setTimeout(function() {
                    resolve(arg);
                }, timeout)
            });
        };

        const command = CommandFactory.getOrCreate(commandKey)
            .run(run)
            .build();

        return command.execute('success');
    }

    describe('toObservable', () => {
        it('should return json string metrics', (done) => {
            executeCommand('HystrixSSECommand1', 0)
                .then(() =>
                    HystrixSSEStream.toObservable(0)
                        .first()
                        .map(JSON.parse)
                        .subscribe(
                            metrics => {
                                expect(metrics.type).toBe('HystrixCommand');
                                expect(metrics.name).toBe('HystrixSSECommand1');
                                expect(metrics.isCircuitBreakerOpen).toBeFalsy();
                            },
                            e => {
                                fail(e);
                                done();
                            },
                            done
                        )
                );
        });


        it('should poll metrics every 5 seconds', function(done) {
            stubTime(1000);
            const run = function(arg) {
                return q.resolve(arg);
            };

            const command = CommandFactory.getOrCreate('UpdateMetrics')
                .run(run)
                .statisticalWindowLength(10)
                .build();
            const updateSpy = sinon.spy(command.metrics, 'update');
            return command.execute('success')
                .then(function() {
                    var stream = HystrixSSEStream.toObservable(1000, testScheduler);
                    stream.subscribe(
                        () => {
                            expect(updateSpy.called).toBeTruthy();
                            done();
                        }
                    );
                    testScheduler.flush()
                });
        });
    });
});

