import * as postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { FeatureUsage, FileAnalysis } from '../types';
import { BaselineChecker } from '../core/BaselineChecker';

/**
 * Analyzes CSS files for web feature usage
 */
export class CSSAnalyzer {
  private baselineChecker: BaselineChecker;

  constructor(baselineChecker: BaselineChecker) {
    this.baselineChecker = baselineChecker;
  }

  public async analyze(content: string, filePath: string): Promise<FileAnalysis> {
    const features: FeatureUsage[] = [];
    
    try {
      const root = postcss.parse(content, { from: filePath });
      
      // Analyze CSS properties, values, and selectors
      root.walkDecls((decl) => {
        this.analyzeDeclaration(decl, features, filePath);
      });

      root.walkRules((rule) => {
        this.analyzeSelector(rule, features, filePath);
      });

      root.walkAtRules((atRule) => {
        this.analyzeAtRule(atRule, features, filePath);
      });

    } catch (error) {
      console.warn(`Failed to parse CSS file ${filePath}:`, error);
    }

    return {
      file: filePath,
      type: 'css',
      features
    };
  }

  private analyzeDeclaration(decl: postcss.Declaration, features: FeatureUsage[], filePath: string): void {
    // Analyze CSS property
    this.checkFeature(decl.prop, decl, features, filePath, 'property');
    
    // Analyze CSS values
    this.analyzeValue(decl.value, decl, features, filePath);

    // Check for vendor prefixes
    if (decl.prop.startsWith('-')) {
      const unprefixed = decl.prop.replace(/^-(?:webkit-|moz-|ms-|o-)/, '');
      this.checkFeature(unprefixed, decl, features, filePath, 'prefixed-property');
    }
  }

  private analyzeSelector(rule: postcss.Rule, features: FeatureUsage[], filePath: string): void {
    try {
      selectorParser((selectors) => {
        selectors.walkPseudos((pseudo) => {
          this.checkFeature(`${pseudo.value}`, rule, features, filePath, 'pseudo-selector');
        });

        selectors.walkAttributes((attr) => {
          if (attr.attribute) {
            this.checkFeature(`[${attr.attribute}]`, rule, features, filePath, 'attribute-selector');
          }
        });

        selectors.walkCombinators((combinator) => {
          if (combinator.value === '>>>' || combinator.value === '/deep/') {
            this.checkFeature('deep-combinator', rule, features, filePath, 'combinator');
          }
        });
      }).processSync(rule.selector);
    } catch (error) {
      // Continue on selector parsing errors
    }
  }

  private analyzeAtRule(atRule: postcss.AtRule, features: FeatureUsage[], filePath: string): void {
    const atRuleName = `@${atRule.name}`;
    this.checkFeature(atRuleName, atRule, features, filePath, 'at-rule');

    // Specific at-rule analysis
    switch (atRule.name) {
      case 'media':
        this.analyzeMediaQuery(atRule.params, atRule, features, filePath);
        break;
      case 'supports':
        this.analyzeSupportsQuery(atRule.params, atRule, features, filePath);
        break;
      case 'container':
        this.checkFeature('container-queries', atRule, features, filePath, 'at-rule');
        break;
      case 'layer':
        this.checkFeature('cascade-layers', atRule, features, filePath, 'at-rule');
        break;
    }
  }

  private analyzeValue(value: string, node: postcss.Node, features: FeatureUsage[], filePath: string): void {
    // CSS Functions
    const functionRegex = /([a-zA-Z-]+)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(value)) !== null) {
      const functionName = match[1];
      this.checkFeature(functionName, node, features, filePath, 'function');
    }

    // CSS Keywords and special values
    const keywords = [
      'initial', 'inherit', 'unset', 'revert', 'revert-layer',
      'fit-content', 'max-content', 'min-content',
      'stretch', 'start', 'end', 'flex-start', 'flex-end',
      'space-between', 'space-around', 'space-evenly'
    ];

    keywords.forEach(keyword => {
      if (value.includes(keyword)) {
        this.checkFeature(keyword, node, features, filePath, 'keyword');
      }
    });

    // CSS Units
    const unitRegex = /\d+(\.\d+)?\s*([a-zA-Z%]+)/g;
    while ((match = unitRegex.exec(value)) !== null) {
      const unit = match[2];
      if (['vh', 'vw', 'vmin', 'vmax', 'ch', 'rem', 'fr'].includes(unit)) {
        this.checkFeature(`${unit}-unit`, node, features, filePath, 'unit');
      }
    }
  }

  private analyzeMediaQuery(query: string, node: postcss.Node, features: FeatureUsage[], filePath: string): void {
    // Media query features
    const mediaFeatures = [
      'prefers-color-scheme', 'prefers-reduced-motion', 'prefers-contrast',
      'hover', 'pointer', 'any-hover', 'any-pointer',
      'display-mode', 'orientation', 'aspect-ratio'
    ];

    mediaFeatures.forEach(feature => {
      if (query.includes(feature)) {
        this.checkFeature(feature, node, features, filePath, 'media-feature');
      }
    });
  }

  private analyzeSupportsQuery(query: string, node: postcss.Node, features: FeatureUsage[], filePath: string): void {
    // Extract properties from @supports queries
    const propertyRegex = /\(\s*([a-zA-Z-]+)\s*:/g;
    let match;
    while ((match = propertyRegex.exec(query)) !== null) {
      this.checkFeature(match[1], node, features, filePath, 'supports-property');
    }
  }

  private checkFeature(
    featureId: string, 
    node: postcss.Node, 
    features: FeatureUsage[], 
    filePath: string,
    type: string
  ): void {
    const result = this.baselineChecker.checkFeature(featureId);
    
    if (result.baseline !== null) {
      const severity = this.determineSeverity(result.baseline, result.meetsCriteria);
      
      features.push({
        feature: featureId,
        featureId: featureId,
        file: filePath,
        line: node.source?.start?.line || 0,
        column: node.source?.start?.column || 0,
        context: this.getContext(node, type),
        baseline: result.baseline,
        browsers: result.browsers,
        severity,
        suggestion: result.suggestion,
        polyfill: this.getPolyfillSuggestion(featureId),
        alternative: this.getAlternativeSuggestion(featureId)
      });
    }
  }

  private determineSeverity(
    baseline: string, 
    meetsCriteria: boolean
  ): 'error' | 'warning' | 'info' {
    if (!meetsCriteria) {
      return baseline === 'limited' ? 'error' : 'warning';
    }
    return 'info';
  }

  private getContext(node: postcss.Node, type: string): string {
    switch (type) {
      case 'property':
        return `${(node as postcss.Declaration).prop}: ${(node as postcss.Declaration).value}`;
      case 'at-rule':
        return `@${(node as postcss.AtRule).name} ${(node as postcss.AtRule).params}`;
      case 'pseudo-selector':
        return `selector: ${(node as postcss.Rule).selector}`;
      default:
        return node.toString().slice(0, 100) + (node.toString().length > 100 ? '...' : '');
    }
  }

  private getPolyfillSuggestion(featureId: string): string | undefined {
    const polyfills = {
      'css-grid': 'CSS Grid polyfill or Flexbox fallback',
      'custom-properties': 'PostCSS custom properties plugin',
      'gap': 'Use margin/padding for older browsers',
      'object-fit': 'object-fit-images polyfill',
      'sticky': 'position: -webkit-sticky; position: sticky;'
    };
    
    return polyfills[featureId as keyof typeof polyfills];
  }

  private getAlternativeSuggestion(featureId: string): string | undefined {
    const alternatives = {
      'css-grid': 'Use Flexbox for simpler layouts',
      'gap': 'Use margin or padding properties',
      'aspect-ratio': 'Use padding-bottom percentage technique',
      'clamp': 'Use calc() with min/max functions',
      'container-queries': 'Use media queries as fallback'
    };
    
    return alternatives[featureId as keyof typeof alternatives];
  }
}