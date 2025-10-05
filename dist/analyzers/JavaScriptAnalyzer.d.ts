import { FileAnalysis } from '../types';
import { BaselineChecker } from '../core/BaselineChecker';
/**
 * Analyzes JavaScript/TypeScript files for web feature usage
 */
export declare class JavaScriptAnalyzer {
    private baselineChecker;
    constructor(baselineChecker: BaselineChecker);
    analyze(content: string, filePath: string): Promise<FileAnalysis>;
    private analyzeMemberExpression;
    private analyzeCallExpression;
    private analyzeNewExpression;
    private mapApiToFeature;
    private checkFeature;
    private determineSeverity;
    private getContext;
    private getPolyfillSuggestion;
    private getAlternativeSuggestion;
}
//# sourceMappingURL=JavaScriptAnalyzer.d.ts.map