'use strict';

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _dns = require('dns');

var _dns2 = _interopRequireDefault(_dns);

var _async = require('async');

var _awsMetadata = require('./aws-metadata');

var _Logger = require('./Logger');

var _defaultConfig = require('./default-config');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var noop = function noop() {};

/*
  Eureka JS client
  This module handles registration with a Eureka server, as well as heartbeats
  for reporting instance health.
*/

function getYaml(file) {
  var yml = {};
  try {
    yml = _jsYaml2['default'].safeLoad(_fs2['default'].readFileSync(file, 'utf8'));
  } catch (e) {}
  return yml;
}

var Eureka = (function () {
  function Eureka() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Eureka);

    // Allow passing in a custom logger:
    this.logger = config.logger || new _Logger.Logger();

    this.logger.debug('initializing eureka client');

    // Load up the current working directory and the environment:
    var cwd = config.cwd || process.cwd();
    var env = process.env.NODE_ENV || 'development';

    var filename = config.filename || 'eureka-client';

    // Load in the configuration files:
    this.config = _deepmerge2['default'](_defaultConfig2['default'], getYaml(_path2['default'].join(cwd, filename + '.yml')));
    this.config = _deepmerge2['default'](this.config, getYaml(_path2['default'].join(cwd, filename + '-' + env + '.yml')));

    // Finally, merge in the passed configuration:
    this.config = _deepmerge2['default'](this.config, config);

    // Validate the provided the values we need:
    this.validateConfig(this.config);

    if (this.amazonDataCenter) {
      this.metadataClient = new _awsMetadata.AwsMetadata({
        logger: this.logger
      });
    }

    this.cache = {
      app: {},
      vip: {}
    };
  }

  /*
    Helper method to get the instance ID. If the datacenter is AWS, this will be the
    instance-id in the metadata. Else, it's the hostName.
  */

  /*
    Build the base Eureka server URL + path
  */

  Eureka.prototype.buildEurekaUrl = function buildEurekaUrl() {
    var _this = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.lookupCurrentEurekaHost(function (eurekaHost) {
      callback((_this.config.eureka.ssl ? 'https' : 'http') + '://' + eurekaHost + ':' + _this.config.eureka.port + _this.config.eureka.servicePath);
    });
  };

  /*
    Registers instance with Eureka, begins heartbeats, and fetches registry.
  */

  Eureka.prototype.start = function start() {
    var _this2 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    _async.series([function (done) {
      if (_this2.metadataClient && _this2.config.eureka.fetchMetadata) {
        return _this2.addInstanceMetadata(done);
      }
      done();
    }, function (done) {
      _this2.register(done);
    }, function (done) {
      if (_this2.config.eureka.fetchRegistry) {
        return _this2.fetchRegistry(done);
      }
      done();
    }], callback);
  };

  /*
    De-registers instance with Eureka, stops heartbeats / registry fetches.
  */

  Eureka.prototype.stop = function stop() {
    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.deregister(callback);
    clearInterval(this.heartbeat);
    clearInterval(this.registryFetch);
  };

  /*
    Validates client configuration.
  */

  Eureka.prototype.validateConfig = function validateConfig(config) {
    function validate(namespace, key) {
      if (!config[namespace][key]) {
        throw new TypeError('Missing "' + namespace + '.' + key + '" config value.');
      }
    }

    validate('instance', 'app');
    validate('instance', 'vipAddress');
    validate('instance', 'port');
    validate('instance', 'dataCenterInfo');
    validate('eureka', 'host');
    validate('eureka', 'port');
  };

  /*
    Registers with the Eureka server and initializes heartbeats on registration success.
  */

  Eureka.prototype.register = function register() {
    var _this3 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.config.instance.status = 'UP';
    var connectionTimeout = setTimeout(function () {
      _this3.logger.debug('It looks like it\'s taking a while to register with ' + 'Eureka. This usually means there is an issue connecting to the host ' + 'specified. Start your application with NODE_DEBUG=request for more logging.');
    }, 10000);
    this.buildEurekaUrl(function (eurekaUrl) {
      _request2['default'].post({
        url: eurekaUrl + _this3.config.instance.app,
        json: true,
        body: { instance: _this3.config.instance }
      }, function (error, response, body) {
        clearTimeout(connectionTimeout);
        if (!error && response.statusCode === 204) {
          _this3.logger.info('registered with eureka: ', _this3.config.instance.app + '/' + _this3.instanceId);
          _this3.startHeartbeats();
          if (_this3.config.eureka.fetchRegistry) {
            _this3.startRegistryFetches();
          }
          return callback(null);
        } else if (error) {
          return callback(error);
        }
        return callback(new Error('eureka registration FAILED: status: ' + response.statusCode + ' body: ' + body));
      });
    });
  };

  /*
    De-registers with the Eureka server and stops heartbeats.
  */

  Eureka.prototype.deregister = function deregister() {
    var _this4 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.buildEurekaUrl(function (eurekaUrl) {
      _request2['default'].del({
        url: '' + eurekaUrl + _this4.config.instance.app + '/' + _this4.instanceId
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          _this4.logger.info('de-registered with eureka: ', _this4.config.instance.app + '/' + _this4.instanceId);
          return callback(null);
        } else if (error) {
          return callback(error);
        }
        return callback(new Error('eureka deregistration FAILED: status: ' + response.statusCode + ' body: ' + body));
      });
    });
  };

  /*
    Sets up heartbeats on interval for the life of the application.
    Heartbeat interval by setting configuration property: eureka.heartbeatInterval
  */

  Eureka.prototype.startHeartbeats = function startHeartbeats() {
    var _this5 = this;

    this.heartbeat = setInterval(function () {
      _this5.renew();
    }, this.config.eureka.heartbeatInterval);
  };

  Eureka.prototype.renew = function renew() {
    var _this6 = this;

    this.buildEurekaUrl(function (eurekaUrl) {
      _request2['default'].put({
        url: '' + eurekaUrl + _this6.config.instance.app + '/' + _this6.instanceId
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          _this6.logger.debug('eureka heartbeat success');
        } else {
          if (error) {
            _this6.logger.error('An error in the request occured.', error);
          }
          _this6.logger.warn('eureka heartbeat FAILED, will retry.', 'status: ' + response.statusCode + ' body: ' + body);
        }
      });
    });
  };

  /*
    Sets up registry fetches on interval for the life of the application.
    Registry fetch interval setting configuration property: eureka.registryFetchInterval
  */

  Eureka.prototype.startRegistryFetches = function startRegistryFetches() {
    var _this7 = this;

    this.registryFetch = setInterval(function () {
      _this7.fetchRegistry();
    }, this.config.eureka.registryFetchInterval);
  };

  /*
    Retrieves a list of instances from Eureka server given an appId
  */

  Eureka.prototype.getInstancesByAppId = function getInstancesByAppId(appId) {
    if (!appId) {
      throw new RangeError('Unable to query instances with no appId');
    }
    var instances = this.cache.app[appId.toUpperCase()];
    if (!instances) {
      throw new Error('Unable to retrieve instances for appId: ' + appId);
    }
    return instances;
  };

  /*
    Retrieves a list of instances from Eureka server given a vipAddress
   */

  Eureka.prototype.getInstancesByVipAddress = function getInstancesByVipAddress(vipAddress) {
    if (!vipAddress) {
      throw new RangeError('Unable to query instances with no vipAddress');
    }
    var instances = this.cache.vip[vipAddress];
    if (!instances) {
      throw new Error('Unable to retrieves instances for vipAddress: ' + vipAddress);
    }
    return instances;
  };

  /*
    Retrieves all applications registered with the Eureka server
   */

  Eureka.prototype.fetchRegistry = function fetchRegistry() {
    var _this8 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.buildEurekaUrl(function (eurekaUrl) {
      _request2['default'].get({
        url: eurekaUrl,
        headers: {
          Accept: 'application/json'
        }
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          _this8.logger.debug('retrieved registry successfully');
          _this8.transformRegistry(JSON.parse(body));
          return callback(null);
        } else if (error) {
          return callback(error);
        }
        callback(new Error('Unable to retrieve registry from Eureka server'));
      });
    });
  };

  /*
    Transforms the given registry and caches the registry locally
   */

  Eureka.prototype.transformRegistry = function transformRegistry(registry) {
    if (!registry) {
      throw new Error('Unable to transform empty registry');
    }
    this.cache = { app: {}, vip: {} };
    if (!registry.applications.application) {
      return;
    }
    if (registry.applications.application.length) {
      for (var i = 0; i < registry.applications.application.length; i++) {
        var app = registry.applications.application[i];
        this.transformApp(app);
      }
    } else {
      this.transformApp(registry.applications.application);
    }
  };

  /*
    Transforms the given application and places in client cache. If an application
      has a single instance, the instance is placed into the cache as an array of one
   */

  Eureka.prototype.transformApp = function transformApp(app) {
    if (app.instance.length) {
      this.cache.app[app.name.toUpperCase()] = app.instance;
      this.cache.vip[app.instance[0].vipAddress] = app.instance;
    } else {
      var instances = [app.instance];
      this.cache.vip[app.instance.vipAddress] = instances;
      this.cache.app[app.name.toUpperCase()] = instances;
    }
  };

  /*
    Fetches the metadata using the built-in client and updates the instance
    configuration with the public hostname and IP address. A string replacement
    is done on the healthCheckUrl and statusPageUrl so that users can define
    the URLs with a placeholder for the host ('__HOST__'). This allows
    flexibility since the host isn't known until the metadata is fetched.
     This will only get called when dataCenterInfo.name is Amazon, but you can
    set config.eureka.fetchMetadata to false if you want to provide your own
    metadata in AWS environments.
  */

  Eureka.prototype.addInstanceMetadata = function addInstanceMetadata() {
    var _this9 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    this.metadataClient.fetchMetadata(function (metadataResult) {
      _this9.config.instance.dataCenterInfo.metadata = _deepmerge2['default'](_this9.config.instance.dataCenterInfo.metadata, metadataResult);
      _this9.config.instance.hostName = metadataResult['public-hostname'];
      _this9.config.instance.ipAddr = metadataResult['public-ipv4'];

      if (_this9.config.instance.statusPageUrl) {
        _this9.config.instance.statusPageUrl = _this9.config.instance.statusPageUrl.replace('__HOST__', metadataResult['public-hostname']);
      }
      if (_this9.config.instance.healthCheckUrl) {
        _this9.config.instance.healthCheckUrl = _this9.config.instance.healthCheckUrl.replace('__HOST__', metadataResult['public-hostname']);
      }

      callback();
    });
  };

  /*
    Returns the Eureka host. This method is async because potentially we might have to
    execute DNS lookups which is an async network operation.
  */

  Eureka.prototype.lookupCurrentEurekaHost = function lookupCurrentEurekaHost() {
    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    if (this.amazonDataCenter && this.config.eureka.useDns) {
      this.locateEurekaHostUsingDns(function (resolvedHost) {
        return callback(resolvedHost);
      });
    } else {
      return callback(this.config.eureka.host);
    }
  };

  /*
    Locates a Eureka host using DNS lookups. The DNS records are looked up by a naming
    convention and TXT records must be created according to the Eureka Wiki here:
    https://github.com/Netflix/eureka/wiki/Configuring-Eureka-in-AWS-Cloud
     Naming convention: txt.<REGION>.<HOST>
   */

  Eureka.prototype.locateEurekaHostUsingDns = function locateEurekaHostUsingDns() {
    var _this10 = this;

    var callback = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

    if (!this.config.eureka.ec2Region) {
      throw new Error('EC2 region was undefined. config.eureka.ec2Region must be set to resolve Eureka using DNS records.');
    }
    _dns2['default'].resolveTxt('txt.' + this.config.eureka.ec2Region + '.' + this.config.eureka.host, function (error, addresses) {
      if (error) {
        throw new Error('Error resolving eureka server list for region [' + _this10.config.eureka.ec2Region + '] using DNS: [' + error + ']');
      }
      _dns2['default'].resolveTxt('txt.' + addresses[0][Math.floor(Math.random() * addresses[0].length)], function (error, results) {
        var _ref;

        if (error) {
          throw new Error('Error locating eureka server using DNS: [' + error + ']');
        }
        _this10.logger.debug('Found Eureka Server @ ', results);
        callback((_ref = []).concat.apply(_ref, [[]].concat(results)).shift());
      });
    });
  };

  _createClass(Eureka, [{
    key: 'instanceId',
    get: function get() {
      if (this.amazonDataCenter) {
        return this.config.instance.dataCenterInfo.metadata['instance-id'];
      }
      return this.config.instance.hostName;
    }

    /*
      Helper method to determine if this is an AWS datacenter.
    */
  }, {
    key: 'amazonDataCenter',
    get: function get() {
      return this.config.instance.dataCenterInfo.name && this.config.instance.dataCenterInfo.name.toLowerCase() === 'amazon';
    }
  }]);

  return Eureka;
})();

exports.Eureka = Eureka;