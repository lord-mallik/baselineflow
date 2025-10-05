import { FileAnalysis } from '../types';
import { BaselineChecker } from '../core/BaselineChecker';
/**
 * Analyzes CSS files for web feature usage
 */
export declare class CSSAnalyzer {
    private baselineChecker;
    constructor(baselineChecker: BaselineChecker);
    analyze(content: string, filePath: string): Promise<FileAnalysis>;
    private analyzeDeclaration;
    private analyzeSelector;
    private analyzeAtRule;
    private analyzeValue;
    private analyzeMediaQuery;
    private analyzeSupportsQuery;
    private checkFeature;
    private determineSeverity;
    private getContext;
    private getPolyfillSuggestion;
    private getAlternativeSuggestion;
}
//# sourceMappingURL=CSSAnalyzer.d.ts.map