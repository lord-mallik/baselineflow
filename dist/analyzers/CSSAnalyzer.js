"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSAnalyzer = void 0;
const postcss = __importStar(require("postcss"));
const postcss_selector_parser_1 = __importDefault(require("postcss-selector-parser"));
/**
 * Analyzes CSS files for web feature usage
 */
class CSSAnalyzer {
    constructor(baselineChecker) {
        this.baselineChecker = baselineChecker;
    }
    async analyze(content, filePath) {
        const features = [];
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
        }
        catch (error) {
            console.warn(`Failed to parse CSS file ${filePath}:`, error);
        }
        return {
            file: filePath,
            type: 'css',
            features
        };
    }
    analyzeDeclaration(decl, features, filePath) {
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
    analyzeSelector(rule, features, filePath) {
        try {
            (0, postcss_selector_parser_1.default)((selectors) => {
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
        }
        catch (error) {
            // Continue on selector parsing errors
        }
    }
    analyzeAtRule(atRule, features, filePath) {
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
    analyzeValue(value, node, features, filePath) {
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
    analyzeMediaQuery(query, node, features, filePath) {
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
    analyzeSupportsQuery(query, node, features, filePath) {
        // Extract properties from @supports queries
        const propertyRegex = /\(\s*([a-zA-Z-]+)\s*:/g;
        let match;
        while ((match = propertyRegex.exec(query)) !== null) {
            this.checkFeature(match[1], node, features, filePath, 'supports-property');
        }
    }
    checkFeature(featureId, node, features, filePath, type) {
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
    determineSeverity(baseline, meetsCriteria) {
        if (!meetsCriteria) {
            return baseline === 'limited' ? 'error' : 'warning';
        }
        return 'info';
    }
    getContext(node, type) {
        switch (type) {
            case 'property':
                return `${node.prop}: ${node.value}`;
            case 'at-rule':
                return `@${node.name} ${node.params}`;
            case 'pseudo-selector':
                return `selector: ${node.selector}`;
            default:
                return node.toString().slice(0, 100) + (node.toString().length > 100 ? '...' : '');
        }
    }
    getPolyfillSuggestion(featureId) {
        const polyfills = {
            'css-grid': 'CSS Grid polyfill or Flexbox fallback',
            'custom-properties': 'PostCSS custom properties plugin',
            'gap': 'Use margin/padding for older browsers',
            'object-fit': 'object-fit-images polyfill',
            'sticky': 'position: -webkit-sticky; position: sticky;'
        };
        return polyfills[featureId];
    }
    getAlternativeSuggestion(featureId) {
        const alternatives = {
            'css-grid': 'Use Flexbox for simpler layouts',
            'gap': 'Use margin or padding properties',
            'aspect-ratio': 'Use padding-bottom percentage technique',
            'clamp': 'Use calc() with min/max functions',
            'container-queries': 'Use media queries as fallback'
        };
        return alternatives[featureId];
    }
}
exports.CSSAnalyzer = CSSAnalyzer;
//# sourceMappingURL=CSSAnalyzer.js.map