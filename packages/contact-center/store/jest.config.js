 const jestConfig = require('../../../jest.base.config.js');

jestConfig.rootDir = '../../../';
jestConfig.testMatch = ['**/store/tests/**/*.ts', '**/store/tests/**/*.tsx'];

module.exports = jestConfig;
