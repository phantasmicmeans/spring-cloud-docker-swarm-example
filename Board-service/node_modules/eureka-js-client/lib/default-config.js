// Default configuration values:

'use strict';

exports.__esModule = true;
exports['default'] = {
  eureka: {
    heartbeatInterval: 30000,
    registryFetchInterval: 30000,
    fetchRegistry: true,
    servicePath: '/eureka/v2/apps/',
    ssl: false,
    useDns: false,
    fetchMetadata: true
  },
  instance: {}
};
module.exports = exports['default'];