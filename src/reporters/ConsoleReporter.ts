import chalk from 'chalk';
import { table } from 'table';
import boxen from 'boxen';
import { AnalysisResult, FeatureUsage } from '../types';

/**
 * Console reporter for displaying analysis results in terminal
 */
export class ConsoleReporter {
  
  public generateReport(result: AnalysisResult): string {
    let output = '';
    
    // Header
    output += this.generateHeader(result);
    
    // Summary
    output += this.generateSummary(result);
    
    // Violations (Errors)
    if (result.violations.length > 0) {
      output += this.generateSection('❌ Baseline Violations (Errors)', result.violations);
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      output += this.generateSection('⚠️  Baseline Warnings', result.warnings);
    }
    
    // Modernization Opportunities
    if (result.modernizationOpportunities.length > 0) {
      output += this.generateModernizationSection(result);
    }
    
    // Footer with recommendations
    output += this.generateFooter(result);
    
    return output;
  }

  private generateHeader(result: AnalysisResult): string {
    const title = '🚀 BaselineFlow Analysis Report';
    const subtitle = `Analyzed ${result.totalFiles} files • Found ${result.totalFeatures} web features`;
    
    return boxen(
      chalk.bold.cyan(title) + '\n' + chalk.gray(subtitle),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan'
      }
    ) + '\n\n';
  }

  private generateSummary(result: AnalysisResult): string {
    const { summary } = result;
    const scoreColor = this.getScoreColor(summary.compatibilityScore);
    
    const summaryData = [
      ['📊 Compatibility Score', chalk[scoreColor](`${summary.compatibilityScore}%`)],
      ['❌ Errors', chalk.red(summary.errors.toString())],
      ['⚠️  Warnings', chalk.yellow(summary.warnings.toString())],
      ['💡 Suggestions', chalk.blue(summary.suggestions.toString())]
    ];

    const summaryTable = table(summaryData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│'
      },
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      }
    });

    return chalk.bold('📋 Summary\n') + summaryTable + '\n';
  }

  private generateSection(title: string, features: FeatureUsage[]): string {
    let output = chalk.bold(title) + '\n\n';
    
    // Group by file
    const groupedByFile = this.groupByFile(features);
    
    for (const [file, fileFeatures] of groupedByFile) {
      output += chalk.underline(`📁 ${this.getRelativePath(file)}`) + '\n';
      
      for (const feature of fileFeatures) {
        output += this.formatFeature(feature) + '\n';
      }
      output += '\n';
    }
    
    return output;
  }

  private generateModernizationSection(result: AnalysisResult): string {
    let output = chalk.bold('🔄 Modernization Opportunities') + '\n\n';
    
    for (const opportunity of result.modernizationOpportunities) {
      const impactIcon = this.getImpactIcon(opportunity.impact);
      const effortIcon = this.getEffortIcon(opportunity.effort);
      
      output += chalk.cyan(`${impactIcon} ${opportunity.oldFeature} → ${opportunity.newFeature}`) + '\n';
      output += chalk.gray(`   Status: ${opportunity.baselineStatus} | Impact: ${opportunity.impact} | Effort: ${opportunity.effort}`) + '\n';
      output += chalk.white(`   ${opportunity.description}`) + '\n';
      
      if (opportunity.example) {
        output += chalk.gray('   Example:') + '\n';
        output += chalk.dim('   ' + opportunity.example.split('\n').join('\n   ')) + '\n';
      }
      output += '\n';
    }
    
    return output;
  }

  private generateFooter(result: AnalysisResult): string {
    const { summary } = result;
    let recommendations: string[] = [];
    
    if (summary.errors > 0) {
      recommendations.push('🔧 Fix critical compatibility issues before deployment');
    }
    
    if (summary.warnings > 0) {
      recommendations.push('⚡ Consider progressive enhancement for newly available features');
    }
    
    if (summary.compatibilityScore < 80) {
      recommendations.push('📈 Improve compatibility score by adopting baseline features');
    }
    
    if (result.modernizationOpportunities.length > 0) {
      recommendations.push('🚀 Explore modernization opportunities to improve code quality');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Great job! Your code follows Baseline compatibility guidelines');
    }

    let footer = chalk.bold('💡 Recommendations') + '\n\n';
    recommendations.forEach(rec => {
      footer += '   ' + rec + '\n';
    });

    footer += '\n' + chalk.gray('Learn more about Baseline: https://web.dev/baseline') + '\n';
    footer += chalk.gray('BaselineFlow: https://github.com/yourusername/baselineflow') + '\n';

    return boxen(footer, {
      padding: 1,
      margin: { top: 1 },
      borderStyle: 'round',
      borderColor: 'gray'
    });
  }

  private formatFeature(feature: FeatureUsage): string {
    const severityIcon = this.getSeverityIcon(feature.severity);
    const baselineIcon = this.getBaselineIcon(feature.baseline);
    const location = chalk.gray(`${feature.line}:${feature.column}`);
    
    let output = `   ${severityIcon} ${baselineIcon} ${chalk.bold(feature.feature)} ${location}`;
    
    if (feature.context) {
      output += chalk.gray(` - ${feature.context.slice(0, 60)}${feature.context.length > 60 ? '...' : ''}`);
    }
    
    if (feature.suggestion) {
      output += '\n     💡 ' + chalk.italic(feature.suggestion);
    }
    
    if (feature.polyfill) {
      output += '\n     🔧 Polyfill: ' + chalk.cyan(feature.polyfill);
    }
    
    if (feature.alternative) {
      output += '\n     ↔️  Alternative: ' + chalk.green(feature.alternative);
    }
    
    // Browser support
    if (feature.browsers && Object.keys(feature.browsers).length > 0) {
      const browserSupport = this.formatBrowserSupport(feature.browsers);
      output += '\n     🌐 ' + browserSupport;
    }
    
    return output;
  }

  private formatBrowserSupport(browsers: any): string {
    const supportInfo: string[] = [];
    
    if (browsers.chrome) supportInfo.push(`Chrome ${browsers.chrome}`);
    if (browsers.firefox) supportInfo.push(`Firefox ${browsers.firefox}`);
    if (browsers.safari) supportInfo.push(`Safari ${browsers.safari}`);
    if (browsers.edge) supportInfo.push(`Edge ${browsers.edge}`);
    
    return supportInfo.join(' • ');
  }

  private groupByFile(features: FeatureUsage[]): Map<string, FeatureUsage[]> {
    const grouped = new Map<string, FeatureUsage[]>();
    
    for (const feature of features) {
      if (!grouped.has(feature.file)) {
        grouped.set(feature.file, []);
      }
      grouped.get(feature.file)!.push(feature);
    }
    
    return grouped;
  }

  private getRelativePath(filePath: string): string {
    const cwd = process.cwd();
    return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'error': return '🚫';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  }

  private getBaselineIcon(baseline: string | null): string {
    switch (baseline) {
      case 'widely-available': return chalk.green('✅');
      case 'newly-available': return chalk.yellow('🆕');
      case 'limited': return chalk.red('⭕');
      default: return chalk.gray('❓');
    }
  }

  private getScoreColor(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }

  private getImpactIcon(impact: string): string {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📌';
    }
  }

  private getEffortIcon(effort: string): string {
    switch (effort) {
      case 'low': return '✅';
      case 'medium': return '⚖️';
      case 'high': return '🔨';
      default: return '📋';
    }
  }
}