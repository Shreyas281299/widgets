const jestConfig = require('../../../jest.base.config.js');

jestConfig.rootDir = '../../../';
jestConfig.testMatch = ['**/cc-components/tests/**/*.ts', '**/cc-components/tests/**/*.tsx'];

module.exports = jestConfig;
