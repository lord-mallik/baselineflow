import { BaselineConfig, AnalysisResult, FeatureUsage } from '../types';
/**
 * Main analyzer that orchestrates file analysis and generates reports
 */
export declare class Analyzer {
    private config;
    private baselineChecker;
    private cssAnalyzer;
    private jsAnalyzer;
    constructor(config: BaselineConfig);
    analyzeProject(projectPath: string): Promise<AnalysisResult>;
    private findFiles;
    private analyzeFile;
    private generateReport;
    private calculateCompatibilityScore;
    private generateModernizationSuggestions;
    private groupFeaturesByType;
    /**
     * Generate progressive enhancement suggestions
     */
    generateProgressiveEnhancements(features: FeatureUsage[]): Array<{
        feature: string;
        fallback: string;
        enhancement: string;
        example: string;
    }>;
    private getProgressiveEnhancement;
}
//# sourceMappingURL=Analyzer.d.ts.map