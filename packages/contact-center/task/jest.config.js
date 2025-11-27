 const jestConfig = require('../../../jest.base.config.js');

jestConfig.rootDir = '../../../';
jestConfig.testMatch = ['**/task/tests/**/*.ts', '**/task/tests/**/*.tsx'];

module.exports = jestConfig;
