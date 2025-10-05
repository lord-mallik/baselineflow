import { AnalysisResult } from '../types';

/**
 * JSON reporter for machine-readable analysis results
 */
export class JSONReporter {
  
  public generateReport(result: AnalysisResult): string {
    // Create a clean, structured JSON report
    const report = {
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        tool: 'BaselineFlow'
      },
      summary: {
        totalFiles: result.totalFiles,
        totalFeatures: result.totalFeatures,
        compatibilityScore: result.summary.compatibilityScore,
        counts: {
          errors: result.summary.errors,
          warnings: result.summary.warnings,
          suggestions: result.summary.suggestions
        }
      },
      violations: result.violations.map(this.formatFeature),
      warnings: result.warnings.map(this.formatFeature),
      suggestions: result.suggestions.map(this.formatFeature),
      modernizationOpportunities: result.modernizationOpportunities.map(opportunity => ({
        category: opportunity.category,
        oldFeature: opportunity.oldFeature,
        newFeature: opportunity.newFeature,
        baselineStatus: opportunity.baselineStatus,
        impact: opportunity.impact,
        effort: opportunity.effort,
        description: opportunity.description,
        example: opportunity.example
      })),
      statistics: this.generateStatistics(result)
    };

    return JSON.stringify(report, null, 2);
  }

  private formatFeature(feature: any) {
    return {
      feature: feature.feature,
      featureId: feature.featureId,
      location: {
        file: feature.file,
        line: feature.line,
        column: feature.column
      },
      context: feature.context,
      baseline: feature.baseline,
      severity: feature.severity,
      browsers: feature.browsers,
      suggestion: feature.suggestion,
      polyfill: feature.polyfill,
      alternative: feature.alternative
    };
  }

  private generateStatistics(result: AnalysisResult) {
    const allFeatures = [...result.violations, ...result.warnings, ...result.suggestions];
    
    // File type distribution
    const fileTypes = new Map<string, number>();
    allFeatures.forEach(feature => {
      const ext = feature.file.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
    });

    // Feature distribution by baseline status
    const baselineDistribution = new Map<string, number>();
    allFeatures.forEach(feature => {
      const status = feature.baseline || 'unknown';
      baselineDistribution.set(status, (baselineDistribution.get(status) || 0) + 1);
    });

    // Most common features
    const featureFrequency = new Map<string, number>();
    allFeatures.forEach(feature => {
      featureFrequency.set(feature.feature, (featureFrequency.get(feature.feature) || 0) + 1);
    });

    const topFeatures = Array.from(featureFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    return {
      fileTypeDistribution: Object.fromEntries(fileTypes),
      baselineDistribution: Object.fromEntries(baselineDistribution),
      topFeatures,
      riskScore: this.calculateRiskScore(result)
    };
  }

  private calculateRiskScore(result: AnalysisResult): number {
    // Calculate a risk score based on violations and warnings
    const errorWeight = 3;
    const warningWeight = 1;
    
    const totalRisk = (result.summary.errors * errorWeight) + (result.summary.warnings * warningWeight);
    const maxPossibleRisk = result.totalFeatures * errorWeight;
    
    if (maxPossibleRisk === 0) return 0;
    
    return Math.round((totalRisk / maxPossibleRisk) * 100);
  }
}