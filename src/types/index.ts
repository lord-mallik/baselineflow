/**
 * BaselineFlow Types
 */

export interface BaselineConfig {
  target: 'widely-available' | 'newly-available' | 'limited';
  browsers: string[];
  exceptions: string[];
  ignoreFiles: string[];
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'auto';
  generateFixes: boolean;
  reportFormat: 'console' | 'json' | 'html' | 'junit';
  outputFile?: string;
}

export interface FeatureUsage {
  feature: string;
  featureId: string;
  file: string;
  line: number;
  column: number;
  context: string;
  baseline: 'widely-available' | 'newly-available' | 'limited' | null;
  browsers: BrowserSupport;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  polyfill?: string;
  alternative?: string;
}

export interface BrowserSupport {
  chrome?: string;
  firefox?: string;
  safari?: string;
  edge?: string;
  chrome_android?: string;
  firefox_android?: string;
  safari_ios?: string;
}

export interface AnalysisResult {
  totalFiles: number;
  totalFeatures: number;
  violations: FeatureUsage[];
  warnings: FeatureUsage[];
  suggestions: FeatureUsage[];
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
    compatibilityScore: number;
  };
  modernizationOpportunities: ModernizationSuggestion[];
}

export interface ModernizationSuggestion {
  category: 'css' | 'javascript' | 'html';
  oldFeature: string;
  newFeature: string;
  baselineStatus: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  description: string;
  example?: string;
}

export interface FileAnalysis {
  file: string;
  type: 'css' | 'javascript' | 'html' | 'typescript' | 'jsx' | 'tsx';
  features: FeatureUsage[];
  framework?: string;
}

export interface ReportOptions {
  format: 'console' | 'json' | 'html' | 'junit';
  outputFile?: string;
  includeContext: boolean;
  showSuggestions: boolean;
  groupByFile: boolean;
}