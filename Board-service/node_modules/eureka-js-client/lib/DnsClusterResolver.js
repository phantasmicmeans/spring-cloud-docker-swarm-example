'use strict';

exports.__esModule = true;

var _dns = require('dns');

var _dns2 = _interopRequireDefault(_dns);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _shuffle = require('lodash/shuffle');

var _shuffle2 = _interopRequireDefault(_shuffle);

var _xor = require('lodash/xor');

var _xor2 = _interopRequireDefault(_xor);

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function noop() {}

/*
  Locates a Eureka host using DNS lookups. The DNS records are looked up by a naming
  convention and TXT records must be created according to the Eureka Wiki here:
  https://github.com/Netflix/eureka/wiki/Configuring-Eureka-in-AWS-Cloud

  Naming convention: txt.<REGION>.<HOST>
 */

var DnsClusterResolver = function () {
  function DnsClusterResolver(config, logger) {
    _classCallCheck(this, DnsClusterResolver);

    this.logger = logger || new _Logger2.default();
    this.serverList = undefined;
    this.config = config;
    if (!this.config.eureka.ec2Region) {
      throw new Error('EC2 region was undefined. ' + 'config.eureka.ec2Region must be set to resolve Eureka using DNS records.');
    }

    if (this.config.eureka.clusterRefreshInterval) {
      this.startClusterRefresh();
    }
  }

  DnsClusterResolver.prototype.resolveEurekaUrl = function resolveEurekaUrl(callback) {
    var _this = this;

    var retryAttempt = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    this.getCurrentCluster(function (err) {
      if (err) return callback(err);

      if (retryAttempt > 0) {
        _this.serverList.push(_this.serverList.shift());
      }
      var _config$eureka = _this.config.eureka;
      var port = _config$eureka.port;
      var servicePath = _config$eureka.servicePath;
      var ssl = _config$eureka.ssl;

      var protocol = ssl ? 'https' : 'http';
      callback(null, protocol + '://' + _this.serverList[0] + ':' + port + servicePath);
    });
  };

  DnsClusterResolver.prototype.getCurrentCluster = function getCurrentCluster(callback) {
    var _this2 = this;

    if (this.serverList) {
      return callback(null, this.serverList);
    }
    this.refreshCurrentCluster(function (err) {
      if (err) return callback(err);
      return callback(null, _this2.serverList);
    });
  };

  DnsClusterResolver.prototype.startClusterRefresh = function startClusterRefresh() {
    var _this3 = this;

    var refreshTimer = setInterval(function () {
      _this3.refreshCurrentCluster(function (err) {
        if (err) _this3.logger.warn(err.message);
      });
    }, this.config.eureka.clusterRefreshInterval);
    refreshTimer.unref();
  };

  DnsClusterResolver.prototype.refreshCurrentCluster = function refreshCurrentCluster() {
    var _this4 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.resolveClusterHosts(function (err, hosts) {
      if (err) return callback(err);
      // if the cluster is the same (aside from order), we want to maintain our order
      if ((0, _xor2.default)(_this4.serverList, hosts).length) {
        _this4.serverList = hosts;
        _this4.logger.info('Eureka cluster located, hosts will be used in the following order', _this4.serverList);
      } else {
        _this4.logger.debug('Eureka cluster hosts unchanged, maintaining current server list.');
      }
      callback();
    });
  };

  DnsClusterResolver.prototype.resolveClusterHosts = function resolveClusterHosts() {
    var _this5 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];
    var _config$eureka2 = this.config.eureka;
    var ec2Region = _config$eureka2.ec2Region;
    var host = _config$eureka2.host;
    var preferSameZone = _config$eureka2.preferSameZone;
    var dataCenterInfo = this.config.instance.dataCenterInfo;

    var metadata = dataCenterInfo ? dataCenterInfo.metadata : undefined;
    var availabilityZone = metadata ? metadata['availability-zone'] : undefined;
    var dnsHost = 'txt.' + ec2Region + '.' + host;
    _dns2.default.resolveTxt(dnsHost, function (err, addresses) {
      var _ref;

      if (err) {
        return callback(new Error('Error resolving eureka cluster for region [' + ec2Region + '] using DNS: [' + err + ']'));
      }
      var zoneRecords = (_ref = []).concat.apply(_ref, addresses);
      var dnsTasks = {};
      zoneRecords.forEach(function (zoneRecord) {
        dnsTasks[zoneRecord] = function (cb) {
          _this5.resolveZoneHosts('txt.' + zoneRecord, cb);
        };
      });
      _async2.default.parallel(dnsTasks, function (error, results) {
        if (error) return callback(error);
        var hosts = [];
        var myZoneHosts = [];
        Object.keys(results).forEach(function (zone) {
          if (preferSameZone && availabilityZone && zone.lastIndexOf(availabilityZone, 0) === 0) {
            myZoneHosts.push.apply(myZoneHosts, results[zone]);
          } else {
            hosts.push.apply(hosts, results[zone]);
          }
        });
        var combinedHosts = [].concat((0, _shuffle2.default)(myZoneHosts), (0, _shuffle2.default)(hosts));
        if (!combinedHosts.length) {
          return callback(new Error('Unable to locate any Eureka hosts in any zone via DNS @ ' + dnsHost));
        }
        callback(null, combinedHosts);
      });
    });
  };

  DnsClusterResolver.prototype.resolveZoneHosts = function resolveZoneHosts(zoneRecord, callback) {
    var _this6 = this;

    _dns2.default.resolveTxt(zoneRecord, function (err, results) {
      var _ref2;

      if (err) {
        _this6.logger.warn('Failed to resolve cluster zone ' + zoneRecord, err.message);
        return callback(new Error('Error resolving cluster zone ' + zoneRecord + ': [' + err + ']'));
      }
      _this6.logger.debug('Found Eureka Servers @ ' + zoneRecord, results);
      callback(null, (_ref2 = []).concat.apply(_ref2, results).filter(function (value) {
        return !!value;
      }));
    });
  };

  return DnsClusterResolver;
}();

exports.default = DnsClusterResolver;