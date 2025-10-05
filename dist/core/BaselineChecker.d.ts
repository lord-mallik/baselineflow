import { BrowserSupport, BaselineConfig } from '../types';
/**
 * Core class for checking Baseline compatibility of web features
 */
export declare class BaselineChecker {
    private config;
    private featureMap;
    constructor(config: BaselineConfig);
    private initializeFeatureMap;
    /**
     * Check if a feature meets the baseline target
     */
    checkFeature(featureId: string): {
        baseline: 'widely-available' | 'newly-available' | 'limited' | null;
        browsers: BrowserSupport;
        meetsCriteria: boolean;
        suggestion?: string;
    };
    private findFeature;
    private generateCssVariations;
    private fuzzySearch;
    private getBaselineStatus;
    private getBrowserSupport;
    private evaluateCriteria;
    private generateSuggestion;
    /**
     * Get modernization suggestions for legacy features
     */
    getModernizationSuggestions(legacyFeatures: string[]): Array<{
        oldFeature: string;
        newFeature: string;
        description: string;
        example?: string;
    }>;
    private addCommonMappings;
}
//# sourceMappingURL=BaselineChecker.d.ts.map