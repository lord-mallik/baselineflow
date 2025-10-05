import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { BaselineConfig, AnalysisResult, FileAnalysis, FeatureUsage, ModernizationSuggestion } from '../types';
import { BaselineChecker } from './BaselineChecker';
import { CSSAnalyzer } from '../analyzers/CSSAnalyzer';
import { SimpleJavaScriptAnalyzer } from '../analyzers/SimpleJavaScriptAnalyzer';

/**
 * Main analyzer that orchestrates file analysis and generates reports
 */
export class Analyzer {
  private config: BaselineConfig;
  private baselineChecker: BaselineChecker;
  private cssAnalyzer: CSSAnalyzer;
  private jsAnalyzer: SimpleJavaScriptAnalyzer;

  constructor(config: BaselineConfig) {
    this.config = config;
    this.baselineChecker = new BaselineChecker(config);
    this.cssAnalyzer = new CSSAnalyzer(this.baselineChecker);
    this.jsAnalyzer = new SimpleJavaScriptAnalyzer(this.baselineChecker);
  }

  public async analyzeProject(projectPath: string): Promise<AnalysisResult> {
    const files = await this.findFiles(projectPath);
    const fileAnalyses: FileAnalysis[] = [];
    
    console.log(`🔍 Analyzing ${files.length} files...`);

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file);
        if (analysis.features.length > 0) {
          fileAnalyses.push(analysis);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${file}:`, error);
      }
    }

    return this.generateReport(fileAnalyses);
  }

  private async findFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      '**/*.{js,jsx,ts,tsx,css,scss,sass,less}',
      '!node_modules/**',
      '!dist/**',
      '!build/**',
      '!coverage/**',
      '!.git/**',
      ...this.config.ignoreFiles.map(pattern => `!${pattern}`)
    ];

    const files = await glob(patterns, {
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

  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const content = await fs.readFile(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    // Determine analyzer based on file extension
    if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
      return await this.cssAnalyzer.analyze(content, filePath);
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      return await this.jsAnalyzer.analyze(content, filePath);
    }

    // Return empty analysis for unsupported files
    return {
      file: filePath,
      type: 'javascript',
      features: []
    };
  }

  private generateReport(fileAnalyses: FileAnalysis[]): AnalysisResult {
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

  private calculateCompatibilityScore(features: FeatureUsage[]): number {
    if (features.length === 0) return 100;

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

  private generateModernizationSuggestions(features: FeatureUsage[]): ModernizationSuggestion[] {
    const suggestions: ModernizationSuggestion[] = [];
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
    const modernCssFeatures = features.filter(f => 
      f.baseline === 'newly-available' && 
      ['container-queries', 'cascade-layers', 'css-grid', 'flexbox'].includes(f.feature)
    );

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

  private groupFeaturesByType(features: FeatureUsage[]): {
    css: FeatureUsage[];
    javascript: FeatureUsage[];
    html: FeatureUsage[];
  } {
    return {
      css: features.filter(f => f.file.match(/\.(css|scss|sass|less)$/)),
      javascript: features.filter(f => f.file.match(/\.(js|jsx|ts|tsx)$/)),
      html: features.filter(f => f.file.match(/\.(html|htm)$/))
    };
  }

  /**
   * Generate progressive enhancement suggestions
   */
  public generateProgressiveEnhancements(features: FeatureUsage[]): Array<{
    feature: string;
    fallback: string;
    enhancement: string;
    example: string;
  }> {
    const enhancements: Array<{
      feature: string;
      fallback: string;
      enhancement: string;
      example: string;
    }> = [];

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

  private getProgressiveEnhancement(featureId: string): {
    fallback: string;
    enhancement: string;
    example: string;
  } | null {
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

    return enhancements[featureId as keyof typeof enhancements] || null;
  }
}