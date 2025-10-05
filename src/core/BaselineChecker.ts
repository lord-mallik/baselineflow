import { features, browsers as browserData } from 'web-features';
import { FeatureUsage, BrowserSupport, BaselineConfig } from '../types';

/**
 * Core class for checking Baseline compatibility of web features
 */
export class BaselineChecker {
  private config: BaselineConfig;
  private featureMap: Map<string, any>;
  
  constructor(config: BaselineConfig) {
    this.config = config;
    this.featureMap = new Map();
    this.initializeFeatureMap();
  }

  private initializeFeatureMap(): void {
    // Build a searchable map of features
    Object.entries(features).forEach(([id, feature]) => {
      const f = feature as any;
      this.featureMap.set(id, f);
      
      // Add alternative searchable names
      if (f.name) {
        this.featureMap.set(f.name.toLowerCase(), f);
      }
      
      // Map CSS features from compat_features
      if (f.compat_features) {
        f.compat_features.forEach((compat: string) => {
          this.featureMap.set(compat, f);
          
          // Extract CSS property names from compat strings
          if (compat.startsWith('css.properties.')) {
            const prop = compat.replace('css.properties.', '');
            this.featureMap.set(prop, f);
          }
        });
      }
      
      // Add common feature name mappings
      this.addCommonMappings(id, f);
    });
  }

  /**
   * Check if a feature meets the baseline target
   */
  public checkFeature(featureId: string): {
    baseline: 'widely-available' | 'newly-available' | 'limited' | null;
    browsers: BrowserSupport;
    meetsCriteria: boolean;
    suggestion?: string;
  } {
    const feature = this.findFeature(featureId);
    
    if (!feature || !feature.status) {
      return {
        baseline: null,
        browsers: {},
        meetsCriteria: false,
        suggestion: `Feature "${featureId}" not found in web-features database`
      };
    }

    const baseline = this.getBaselineStatus(feature.status);
    const browsers = this.getBrowserSupport(feature.status);
    const meetsCriteria = this.evaluateCriteria(baseline);
    const suggestion = this.generateSuggestion(feature, baseline);

    return {
      baseline,
      browsers,
      meetsCriteria,
      suggestion
    };
  }

  private findFeature(query: string): any {
    // Direct ID match
    if (this.featureMap.has(query)) {
      return this.featureMap.get(query);
    }

    // Lowercase match
    const lowerQuery = query.toLowerCase();
    if (this.featureMap.has(lowerQuery)) {
      return this.featureMap.get(lowerQuery);
    }

    // CSS property matching (remove prefixes, handle variations)
    const cssVariations = this.generateCssVariations(query);
    for (const variation of cssVariations) {
      if (this.featureMap.has(variation)) {
        return this.featureMap.get(variation);
      }
    }

    // Fuzzy search for partial matches
    return this.fuzzySearch(query);
  }

  private generateCssVariations(property: string): string[] {
    const variations = [property];
    
    // Remove vendor prefixes
    const withoutPrefix = property.replace(/^-(?:webkit-|moz-|ms-|o-)/, '');
    if (withoutPrefix !== property) {
      variations.push(withoutPrefix);
    }

    // Convert camelCase to kebab-case
    const kebab = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    variations.push(kebab);

    // Handle common CSS feature patterns
    variations.push(`css-${withoutPrefix}`);
    variations.push(`css.properties.${withoutPrefix}`);
    
    return variations;
  }

  private fuzzySearch(query: string): any {
    const queryLower = query.toLowerCase();
    
    // Search through feature names and IDs
    for (const [key, feature] of this.featureMap.entries()) {
      if (key.includes(queryLower) || 
          (feature.name && feature.name.toLowerCase().includes(queryLower))) {
        return feature;
      }
    }
    
    return null;
  }

  private getBaselineStatus(status: any): 'widely-available' | 'newly-available' | 'limited' {
    if (status.baseline === 'high') {
      return 'widely-available';
    } else if (status.baseline === 'low') {
      return 'newly-available';
    } else {
      return 'limited';
    }
  }

  private getBrowserSupport(status: any): BrowserSupport {
    return {
      chrome: status.support?.chrome,
      firefox: status.support?.firefox,
      safari: status.support?.safari,
      edge: status.support?.edge,
      chrome_android: status.support?.chrome_android,
      firefox_android: status.support?.firefox_android,
      safari_ios: status.support?.safari_ios
    };
  }

  private evaluateCriteria(baseline: string): boolean {
    // Check if feature is allowed based on exceptions
    const isException = this.config.exceptions.length > 0;
    
    switch (this.config.target) {
      case 'widely-available':
        return baseline === 'widely-available';
      case 'newly-available':
        return baseline === 'widely-available' || baseline === 'newly-available';
      case 'limited':
        return true; // Allow all features
      default:
        return false;
    }
  }

  private generateSuggestion(feature: any, baseline: string): string | undefined {
    if (baseline === 'limited') {
      return `Consider using a polyfill or waiting for broader browser support. Check caniuse.com for alternatives.`;
    }
    
    if (baseline === 'newly-available' && this.config.target === 'widely-available') {
      return `Feature is newly available in Baseline. Consider progressive enhancement or polyfills for older browsers.`;
    }

    return undefined;
  }

  /**
   * Get modernization suggestions for legacy features
   */
  public getModernizationSuggestions(legacyFeatures: string[]): Array<{
    oldFeature: string;
    newFeature: string;
    description: string;
    example?: string;
  }> {
    const suggestions: Array<{
      oldFeature: string;
      newFeature: string;
      description: string;
      example?: string;
    }> = [];
    
    // Common modernization patterns
    const modernizationMap = {
      'float': {
        newFeature: 'flexbox',
        description: 'Replace float-based layouts with modern Flexbox',
        example: 'display: flex; justify-content: space-between;'
      },
      'clearfix': {
        newFeature: 'flexbox',
        description: 'Use Flexbox instead of clearfix hacks',
        example: 'display: flex; flex-wrap: wrap;'
      },
      'position: absolute': {
        newFeature: 'css-grid',
        description: 'Consider CSS Grid for complex layouts',
        example: 'display: grid; grid-template-areas: "header header"'
      }
    };

    legacyFeatures.forEach(feature => {
      if (modernizationMap[feature as keyof typeof modernizationMap]) {
        suggestions.push({
          oldFeature: feature,
          ...modernizationMap[feature as keyof typeof modernizationMap]
        });
      }
    });

    return suggestions;
  }

  private addCommonMappings(id: string, feature: any): void {
    // Add common CSS and JavaScript feature mappings
    const mappings: Record<string, string[]> = {
      'flexbox': ['flex', 'flexbox', 'css-flexbox'],
      'css-grid': ['grid', 'css-grid', 'grid-template-columns'],
      'container-queries': ['container-queries', '@container'],
      'custom-properties': ['css-variables', 'css-custom-properties', '--'],
      'fetch': ['fetch', 'fetch-api'],
      'promises': ['promise', 'promises'],
      'async-functions': ['async', 'async-await'],
      'arrow-functions': ['arrow-functions', '=>'],
      'template-literals': ['template-literals', 'template-strings'],
      'destructuring-assignment': ['destructuring'],
      'spread-syntax': ['spread-operator', '...'],
      'optional-chaining': ['?.'],
      'nullish-coalescing': ['??']
    };

    if (mappings[id]) {
      mappings[id].forEach(alias => {
        this.featureMap.set(alias, feature);
      });
    }
  }
}