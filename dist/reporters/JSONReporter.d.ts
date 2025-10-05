import { AnalysisResult } from '../types';
/**
 * JSON reporter for machine-readable analysis results
 */
export declare class JSONReporter {
    generateReport(result: AnalysisResult): string;
    private formatFeature;
    private generateStatistics;
    private calculateRiskScore;
}
//# sourceMappingURL=JSONReporter.d.ts.map