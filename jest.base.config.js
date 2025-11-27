const path = require('path');

const baseConfig = {
  collectCoverage: true,
  coverageReporters: ['lcov'],
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/(?!(@momentum-design/components|@momentum-ui/react-collaboration|@lit|lit|cheerio|react-error-boundary))',
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '\\.[jt]s?$': 'babel-jest',
  },
  moduleDirectories: ['node_modules', 'src'],
};

module.exports = baseConfig;
