const base = require('./jest.base.config.js');

const makeProject = (overrides) => ({
  ...base,
  ...overrides,
});

module.exports = {
  globalConfig: {
    collectCoverage: true,
    coverageReporters: ['lcov', 'html'],
  },
  projects: [
    makeProject({
      displayName: 'tooling',
      rootDir: '.',
      testMatch: ['<rootDir>/tooling/tests/**/*.js'],
    }),
    makeProject({
      displayName: 'cc-components',
      rootDir: '.',
      testMatch: ['**/cc-components/tests/**/*.ts', '**/cc-components/tests/**/*.tsx'],
    }),
    makeProject({
      displayName: 'station-login',
      rootDir: '.',
      testMatch: ['**/station-login/tests/**/*.ts', '**/station-login/tests/**/*.tsx'],
    }),
    makeProject({
      displayName: 'store',
      rootDir: '.',
      testMatch: ['**/store/tests/**/*.ts', '**/store/tests/**/*.tsx'],
    }),
    makeProject({
      displayName: 'task',
      rootDir: '.',
      testMatch: ['**/task/tests/**/*.ts', '**/task/tests/**/*.tsx'],
    }),
    makeProject({
      displayName: 'user-state',
      rootDir: '.',
      testMatch: ['**/user-state/tests/**/*.ts', '**/user-state/tests/**/*.tsx'],
    }),
    makeProject({
      displayName: 'ui-logging',
      rootDir: '.',
      testMatch: ['**/ui-logging/tests/**/*.ts', '**/ui-logging/tests/**/*.tsx'],
    }),
  ],
};
