import { AnalysisResult } from '../types';
/**
 * Console reporter for displaying analysis results in terminal
 */
export declare class ConsoleReporter {
    generateReport(result: AnalysisResult): string;
    private generateHeader;
    private generateSummary;
    private generateSection;
    private generateModernizationSection;
    private generateFooter;
    private formatFeature;
    private formatBrowserSupport;
    private groupByFile;
    private getRelativePath;
    private getSeverityIcon;
    private getBaselineIcon;
    private getScoreColor;
    private getImpactIcon;
    private getEffortIcon;
}
//# sourceMappingURL=ConsoleReporter.d.ts.map