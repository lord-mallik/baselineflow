/**
 * Jest test setup
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock file system operations for testing
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
}));

// Mock glob for testing
jest.mock('glob', () => ({
  glob: jest.fn(),
}));

// Add custom matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBaselineFeature(): R;
      toHaveCompatibilityScore(score: number): R;
    }
  }
}

// Custom matcher for baseline features
expect.extend({
  toBeValidBaselineFeature(received) {
    const validStatuses = ['widely-available', 'newly-available', 'limited', null];
    const pass = validStatuses.includes(received.baseline);
    
    if (pass) {
      return {
        message: () => `expected ${received.baseline} not to be a valid baseline status`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received.baseline} to be a valid baseline status`,
        pass: false,
      };
    }
  },

  toHaveCompatibilityScore(received, expectedScore) {
    const actualScore = received.summary?.compatibilityScore;
    const pass = actualScore === expectedScore;
    
    if (pass) {
      return {
        message: () => `expected compatibility score not to be ${expectedScore}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected compatibility score to be ${expectedScore}, received ${actualScore}`,
        pass: false,
      };
    }
  },
});

// Set up test timeout
jest.setTimeout(10000);