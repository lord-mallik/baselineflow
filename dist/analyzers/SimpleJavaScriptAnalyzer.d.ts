import { FileAnalysis } from '../types';
import { BaselineChecker } from '../core/BaselineChecker';
/**
 * Simplified JavaScript analyzer using regex patterns
 */
export declare class SimpleJavaScriptAnalyzer {
    private baselineChecker;
    constructor(baselineChecker: BaselineChecker);
    analyze(content: string, filePath: string): Promise<FileAnalysis>;
    private getFileType;
    private analyzeLineForFeatures;
    private addFeature;
    private determineSeverity;
    private getPolyfillSuggestion;
    private getAlternativeSuggestion;
}
//# sourceMappingURL=SimpleJavaScriptAnalyzer.d.ts.map