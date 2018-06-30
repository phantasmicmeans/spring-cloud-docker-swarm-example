'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _Logger = require('./Logger');

/*
  Utility class for pulling AWS metadata that Eureka requires when registering as an Amazon instance (datacenter).
*/

var MetadataClient = (function () {
  function MetadataClient(config) {
    _classCallCheck(this, MetadataClient);

    this.logger = config.logger || new _Logger.Logger();
    this.host = config.host || '169.254.169.254';
  }

  MetadataClient.prototype.fetchMetadata = function fetchMetadata(resultsCallback) {
    var _this = this;

    _async2['default'].parallel({
      'ami-id': function amiId(callback) {
        _this.lookupMetadataKey('ami-id', callback);
      },
      'instance-id': function instanceId(callback) {
        _this.lookupMetadataKey('instance-id', callback);
      },
      'instance-type': function instanceType(callback) {
        _this.lookupMetadataKey('instance-type', callback);
      },
      'local-ipv4': function localIpv4(callback) {
        _this.lookupMetadataKey('local-ipv4', callback);
      },
      'local-hostname': function localHostname(callback) {
        _this.lookupMetadataKey('local-hostname', callback);
      },
      'availability-zone': function availabilityZone(callback) {
        _this.lookupMetadataKey('placement/availability-zone', callback);
      },
      'public-hostname': function publicHostname(callback) {
        _this.lookupMetadataKey('public-hostname', callback);
      },
      'public-ipv4': function publicIpv4(callback) {
        _this.lookupMetadataKey('public-ipv4', callback);
      },
      'mac': function mac(callback) {
        _this.lookupMetadataKey('mac', callback);
      },
      'accountId': function accountId(callback) {
        // the accountId is in the identity document.
        _this.lookupInstanceIdentity(function (identity) {
          callback(null, identity ? identity['accountId'] : null);
        });
      }
    }, function (error, results) {
      // we need the mac before we can lookup the vpcId...
      _this.lookupMetadataKey('network/interfaces/macs/' + results.mac + '/vpc-id', function (error, vpcId) {
        results['vpc-id'] = vpcId;
        _this.logger.info('Instance AWS Metadata', results);
        resultsCallback(results);
      });
    });
  };

  MetadataClient.prototype.lookupMetadataKey = function lookupMetadataKey(key, callback) {
    var _this2 = this;

    _request2['default'].get({
      url: 'http://' + this.host + '/latest/meta-data/' + key
    }, function (error, response, body) {
      if (error) {
        _this2.logger.error('Error requesting metadata key', error);
      }
      callback(null, error ? null : body);
    });
  };

  MetadataClient.prototype.lookupInstanceIdentity = function lookupInstanceIdentity(callback) {
    var _this3 = this;

    _request2['default'].get({
      url: 'http://' + this.host + '/latest/dynamic/instance-identity/document'
    }, function (error, response, body) {
      if (error) {
        _this3.logger.error('Error requesting instance identity document', error);
      }
      callback(null, error ? null : JSON.parse(body));
    });
  };

  return MetadataClient;
})();

exports.MetadataClient = MetadataClient;