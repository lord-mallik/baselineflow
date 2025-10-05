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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const BaselineChecker_1 = require("./BaselineChecker");
const CSSAnalyzer_1 = require("../analyzers/CSSAnalyzer");
const SimpleJavaScriptAnalyzer_1 = require("../analyzers/SimpleJavaScriptAnalyzer");
/**
 * Main analyzer that orchestrates file analysis and generates reports
 */
class Analyzer {
    constructor(config) {
        this.config = config;
        this.baselineChecker = new BaselineChecker_1.BaselineChecker(config);
        this.cssAnalyzer = new CSSAnalyzer_1.CSSAnalyzer(this.baselineChecker);
        this.jsAnalyzer = new SimpleJavaScriptAnalyzer_1.SimpleJavaScriptAnalyzer(this.baselineChecker);
    }
    async analyzeProject(projectPath) {
        const files = await this.findFiles(projectPath);
        const fileAnalyses = [];
        console.log(`🔍 Analyzing ${files.length} files...`);
        for (const file of files) {
            try {
                const analysis = await this.analyzeFile(file);
                if (analysis.features.length > 0) {
                    fileAnalyses.push(analysis);
                }
            }
            catch (error) {
                console.warn(`⚠️  Failed to analyze ${file}:`, error);
            }
        }
        return this.generateReport(fileAnalyses);
    }
    async findFiles(projectPath) {
        const patterns = [
            '**/*.{js,jsx,ts,tsx,css,scss,sass,less}',
            '!node_modules/**',
            '!dist/**',
            '!build/**',
            '!coverage/**',
            '!.git/**',
            ...this.config.ignoreFiles.map(pattern => `!${pattern}`)
        ];
        const files = await (0, glob_1.glob)(patterns, {
            cwd: projectPath,
            absolute: true,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
        });
        return files.filter(file => {
            // Additional filtering
            const ext = path.extname(file).toLowerCase();
            return ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less'].includes(ext);
        });
    }
    async analyzeFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        // Determine analyzer based on file extension
        if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
            return await this.cssAnalyzer.analyze(content, filePath);
        }
        else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            return await this.jsAnalyzer.analyze(content, filePath);
        }
        // Return empty analysis for unsupported files
        return {
            file: filePath,
            type: 'javascript',
            features: []
        };
    }
    generateReport(fileAnalyses) {
        const allFeatures = fileAnalyses.flatMap(analysis => analysis.features);
        const violations = allFeatures.filter(f => f.severity === 'error');
        const warnings = allFeatures.filter(f => f.severity === 'warning');
        const suggestions = allFeatures.filter(f => f.severity === 'info');
        const compatibilityScore = this.calculateCompatibilityScore(allFeatures);
        const modernizationOpportunities = this.generateModernizationSuggestions(allFeatures);
        return {
            totalFiles: fileAnalyses.length,
            totalFeatures: allFeatures.length,
            violations,
            warnings,
            suggestions,
            summary: {
                errors: violations.length,
                warnings: warnings.length,
                suggestions: suggestions.length,
                compatibilityScore
            },
            modernizationOpportunities
        };
    }
    calculateCompatibilityScore(features) {
        if (features.length === 0)
            return 100;
        const scores = features.map(feature => {
            switch (feature.baseline) {
                case 'widely-available': return 100;
                case 'newly-available': return 75;
                case 'limited': return 25;
                default: return 50;
            }
        });
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    generateModernizationSuggestions(features) {
        const suggestions = [];
        const featureGroups = this.groupFeaturesByType(features);
        // CSS Modernization
        if (featureGroups.css.some(f => f.feature.includes('float'))) {
            suggestions.push({
                category: 'css',
                oldFeature: 'Float-based layouts',
                newFeature: 'CSS Grid/Flexbox',
                baselineStatus: 'widely-available',
                impact: 'high',
                effort: 'medium',
                description: 'Replace float-based layouts with modern CSS Grid or Flexbox for better responsive design',
                example: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));'
            });
        }
        // JavaScript Modernization
        if (featureGroups.javascript.some(f => f.feature === 'xhr')) {
            suggestions.push({
                category: 'javascript',
                oldFeature: 'XMLHttpRequest',
                newFeature: 'Fetch API',
                baselineStatus: 'widely-available',
                impact: 'medium',
                effort: 'low',
                description: 'Replace XMLHttpRequest with modern Fetch API for cleaner async code',
                example: 'fetch("/api/data").then(response => response.json())'
            });
        }
        // Modern CSS features
        const modernCssFeatures = features.filter(f => f.baseline === 'newly-available' &&
            ['container-queries', 'cascade-layers', 'css-grid', 'flexbox'].includes(f.feature));
        if (modernCssFeatures.length > 0) {
            suggestions.push({
                category: 'css',
                oldFeature: 'Legacy layout techniques',
                newFeature: 'Modern CSS features',
                baselineStatus: 'newly-available',
                impact: 'high',
                effort: 'medium',
                description: 'Adopt newly available CSS features for better layouts and maintainability'
            });
        }
        return suggestions;
    }
    groupFeaturesByType(features) {
        return {
            css: features.filter(f => f.file.match(/\.(css|scss|sass|less)$/)),
            javascript: features.filter(f => f.file.match(/\.(js|jsx|ts|tsx)$/)),
            html: features.filter(f => f.file.match(/\.(html|htm)$/))
        };
    }
    /**
     * Generate progressive enhancement suggestions
     */
    generateProgressiveEnhancements(features) {
        const enhancements = [];
        for (const feature of features) {
            if (feature.baseline === 'newly-available' || feature.baseline === 'limited') {
                const enhancement = this.getProgressiveEnhancement(feature.feature);
                if (enhancement) {
                    enhancements.push({
                        feature: feature.feature,
                        fallback: enhancement.fallback,
                        enhancement: enhancement.enhancement,
                        example: enhancement.example
                    });
                }
            }
        }
        return enhancements;
    }
    getProgressiveEnhancement(featureId) {
        const enhancements = {
            'css-grid': {
                fallback: 'Flexbox or float-based layout',
                enhancement: 'CSS Grid for complex layouts',
                example: `
.grid-container {
  display: flex; /* fallback */
  flex-wrap: wrap;
}

@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
}`
            },
            'container-queries': {
                fallback: 'Media queries',
                enhancement: 'Container queries for component-based responsive design',
                example: `
/* Fallback with media queries */
@media (min-width: 400px) {
  .card { flex-direction: row; }
}

/* Enhancement with container queries */
@container (min-width: 400px) {
  .card { flex-direction: row; }
}`
            },
            'aspect-ratio': {
                fallback: 'Padding-bottom technique',
                enhancement: 'Native aspect-ratio property',
                example: `
.aspect-box {
  /* Fallback */
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
}

.aspect-box > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Enhancement */
@supports (aspect-ratio: 16/9) {
  .aspect-box {
    aspect-ratio: 16/9;
    padding-bottom: 0;
  }
  
  .aspect-box > * {
    position: static;
  }
}`
            }
        };
        return enhancements[featureId] || null;
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=Analyzer.js.map