"use strict";

exports.__esModule = true;
exports.arrayOrObj = arrayOrObj;
exports.findInstance = findInstance;
exports.normalizeDelta = normalizeDelta;
/*
  General utilities for handling processing of delta changes from eureka.
*/
function arrayOrObj(mysteryValue) {
  return Array.isArray(mysteryValue) ? mysteryValue : [mysteryValue];
}

function findInstance(a) {
  return function (b) {
    return a.hostName === b.hostName && a.port.$ === b.port.$;
  };
}

function normalizeDelta(appDelta) {
  return arrayOrObj(appDelta).map(function (app) {
    app.instance = arrayOrObj(app.instance);
    return app;
  });
}