'use strict';

exports.__esModule = true;

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
  Locates a Eureka host using static configuration. Configuration can either be
  done using a simple host and port, or a map of serviceUrls.
 */
var ConfigClusterResolver = function () {
  function ConfigClusterResolver(config, logger) {
    _classCallCheck(this, ConfigClusterResolver);

    this.logger = logger || new _Logger2.default();
    this.config = config;
    this.serviceUrls = this.buildServiceUrls();
  }

  ConfigClusterResolver.prototype.resolveEurekaUrl = function resolveEurekaUrl(callback) {
    var retryAttempt = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    if (this.serviceUrls.length > 1 && retryAttempt > 0) {
      this.serviceUrls.push(this.serviceUrls.shift());
    }
    callback(null, this.serviceUrls[0]);
  };

  ConfigClusterResolver.prototype.buildServiceUrls = function buildServiceUrls() {
    var _config$eureka = this.config.eureka;
    var host = _config$eureka.host;
    var port = _config$eureka.port;
    var servicePath = _config$eureka.servicePath;
    var ssl = _config$eureka.ssl;
    var serviceUrls = _config$eureka.serviceUrls;
    var preferSameZone = _config$eureka.preferSameZone;
    var dataCenterInfo = this.config.instance.dataCenterInfo;

    var metadata = dataCenterInfo ? dataCenterInfo.metadata : undefined;
    var instanceZone = metadata ? metadata['availability-zone'] : undefined;
    var urls = [];
    var zones = this.getAvailabilityZones();
    if (serviceUrls) {
      zones.forEach(function (zone) {
        if (serviceUrls[zone]) {
          if (preferSameZone && instanceZone && instanceZone === zone) {
            urls.unshift.apply(urls, serviceUrls[zone]);
          }
          urls.push.apply(urls, serviceUrls[zone]);
        }
      });
    }
    if (!urls.length) {
      var protocol = ssl ? 'https' : 'http';
      urls.push(protocol + '://' + host + ':' + port + servicePath);
    }
    return urls;
  };

  ConfigClusterResolver.prototype.getAvailabilityZones = function getAvailabilityZones() {
    var _config$eureka2 = this.config.eureka;
    var ec2Region = _config$eureka2.ec2Region;
    var availabilityZones = _config$eureka2.availabilityZones;

    if (ec2Region && availabilityZones && availabilityZones[ec2Region]) {
      return availabilityZones[ec2Region];
    }
    return ['default'];
  };

  return ConfigClusterResolver;
}();

exports.default = ConfigClusterResolver;