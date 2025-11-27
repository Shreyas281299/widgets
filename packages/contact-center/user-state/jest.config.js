 const jestConfig = require('../../../jest.base.config.js');

jestConfig.rootDir = '../../../';
jestConfig.testMatch = ['**/user-state/tests/**/*.ts', '**/user-state/tests/**/*.tsx'];

module.exports = jestConfig;
