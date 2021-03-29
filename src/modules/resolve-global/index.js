/**
 * @author sindresorhus/resolve-global
 */
'use strict';
const path = require('path');
const globalDirs = require('global-dirs');

const resolveGlobal = (moduleId) => {
  try {
    return __non_webpack_require__.resolve(
      path.join(globalDirs.yarn.packages, moduleId),
    );
  } catch (_) {
    return __non_webpack_require__.resolve(
      path.join(globalDirs.npm.packages, moduleId),
    );
  }
};

module.exports = resolveGlobal;

module.exports.silent = (moduleId) => {
  try {
    return resolveGlobal(moduleId);
  } catch (_) {
    return undefined;
  }
};
