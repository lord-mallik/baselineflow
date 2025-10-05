import { BaselineChecker } from '../src/core/BaselineChecker';
import { BaselineConfig } from '../src/types';

describe('BaselineChecker', () => {
  let checker: BaselineChecker;
  let config: BaselineConfig;

  beforeEach(() => {
    config = {
      target: 'widely-available',
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      exceptions: [],
      ignoreFiles: [],
      generateFixes: false,
      reportFormat: 'console'
    };
    checker = new BaselineChecker(config);
  });

  describe('checkFeature', () => {
    it('should identify widely available features', () => {
      const result = checker.checkFeature('flexbox');
      
      expect(result.baseline).toBe('widely-available');
      expect(result.meetsCriteria).toBe(true);
      expect(result.browsers).toBeDefined();
    });

    it('should identify newly available features', () => {
      const result = checker.checkFeature('container-queries');
      
      expect(result.baseline).toBe('newly-available');
      expect(result.meetsCriteria).toBe(false); // Not widely available yet
      expect(result.suggestion).toContain('newly available');
    });

    it('should handle unknown features', () => {
      const result = checker.checkFeature('non-existent-feature');
      
      expect(result.baseline).toBe(null);
      expect(result.meetsCriteria).toBe(false);
      expect(result.suggestion).toContain('not found');
    });

    it('should handle CSS property variations', () => {
      // Test various CSS property formats
      const tests = [
        'display',
        'css-grid',
        'grid',
        'flexbox'
      ];

      tests.forEach(feature => {
        const result = checker.checkFeature(feature);
        expect(result.baseline).not.toBe(null);
      });
    });

    it('should respect target configuration', () => {
      const newlyAvailableConfig = { ...config, target: 'newly-available' as const };
      const newChecker = new BaselineChecker(newlyAvailableConfig);
      
      const result = newChecker.checkFeature('container-queries');
      expect(result.meetsCriteria).toBe(true); // Should pass for newly-available target
    });

    it('should handle exceptions correctly', () => {
      const configWithExceptions = { 
        ...config, 
        exceptions: ['container-queries']
      };
      const newChecker = new BaselineChecker(configWithExceptions);
      
      const result = newChecker.checkFeature('container-queries');
      // Even with exceptions, the baseline status should be accurate
      expect(result.baseline).toBe('newly-available');
    });
  });

  describe('getModernizationSuggestions', () => {
    it('should provide modernization suggestions', () => {
      const suggestions = checker.getModernizationSuggestions(['float', 'clearfix']);
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].oldFeature).toBe('float');
      expect(suggestions[0].newFeature).toBe('flexbox');
      expect(suggestions[0].description).toContain('Flexbox');
    });

    it('should handle empty feature list', () => {
      const suggestions = checker.getModernizationSuggestions([]);
      expect(suggestions).toHaveLength(0);
    });

    it('should ignore unknown legacy features', () => {
      const suggestions = checker.getModernizationSuggestions(['unknown-feature']);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('CSS property handling', () => {
    it('should handle vendor prefixes', () => {
      const tests = [
        { input: '-webkit-transform', expected: 'transform' },
        { input: '-moz-appearance', expected: 'appearance' },
        { input: '-ms-grid', expected: 'grid' }
      ];

      tests.forEach(({ input, expected }) => {
        const result = checker.checkFeature(input);
        // Should find the unprefixed version
        expect(result.baseline).not.toBe(null);
      });
    });

    it('should handle camelCase to kebab-case conversion', () => {
      const result = checker.checkFeature('backgroundColor');
      expect(result.baseline).not.toBe(null);
    });
  });

  describe('browser support information', () => {
    it('should provide browser support data', () => {
      const result = checker.checkFeature('flexbox');
      
      expect(result.browsers).toBeDefined();
      expect(typeof result.browsers.chrome).toBe('string');
      expect(typeof result.browsers.firefox).toBe('string');
    });

    it('should handle features with partial browser support', () => {
      const result = checker.checkFeature('container-queries');
      
      expect(result.browsers).toBeDefined();
      // Some browsers might not support it yet
      expect(Object.keys(result.browsers).length).toBeGreaterThan(0);
    });
  });
});