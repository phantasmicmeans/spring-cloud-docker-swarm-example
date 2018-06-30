'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-underscore-dangle */
var LEVELS = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20
};
var DEFAULT_LEVEL = LEVELS.info;

var Logger = function () {
  function Logger() {
    _classCallCheck(this, Logger);

    this._level = DEFAULT_LEVEL;
  }

  Logger.prototype.level = function level(inVal) {
    var val = inVal;
    if (val) {
      if (typeof val === 'string') {
        val = LEVELS[val];
      }
      this._level = val || DEFAULT_LEVEL;
    }
    return this._level;
  };

  // Abstract the console call:


  Logger.prototype._log = function _log(method, args) {
    if (this._level <= LEVELS[method === 'log' ? 'debug' : method]) {
      var _console;

      /* eslint-disable no-console */
      (_console = console)[method].apply(_console, args);
      /* eslint-enable no-console */
    }
  };

  Logger.prototype.error = function error() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return this._log('error', args);
  };

  Logger.prototype.warn = function warn() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return this._log('warn', args);
  };

  Logger.prototype.info = function info() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return this._log('info', args);
  };

  Logger.prototype.debug = function debug() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return this._log('log', args);
  };

  return Logger;
}();

exports.default = Logger;