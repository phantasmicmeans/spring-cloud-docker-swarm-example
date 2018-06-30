module.exports = {
   commandFactory: require("./lib/command/CommandFactory"),
   metricsFactory: require("./lib/metrics/CommandMetrics").Factory,
   circuitFactory: require("./lib/command/CircuitBreaker"),
   hystrixConfig: require("./lib/util/HystrixConfig"),
   hystrixSSEStream: require("./lib/http/HystrixSSEStream")
};