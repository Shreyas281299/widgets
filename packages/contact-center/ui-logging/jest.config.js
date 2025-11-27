 const jestConfig = require('../../../jest.base.config.js');

jestConfig.rootDir = '../../../';
jestConfig.testMatch = ['**/ui-logging/tests/**/*.ts', '**/ui-logging/tests/**/*.tsx'];

module.exports = jestConfig;
