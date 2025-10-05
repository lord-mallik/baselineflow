"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleReporter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const table_1 = require("table");
const boxen_1 = __importDefault(require("boxen"));
/**
 * Console reporter for displaying analysis results in terminal
 */
class ConsoleReporter {
    generateReport(result) {
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
    generateHeader(result) {
        const title = '🚀 BaselineFlow Analysis Report';
        const subtitle = `Analyzed ${result.totalFiles} files • Found ${result.totalFeatures} web features`;
        return (0, boxen_1.default)(chalk_1.default.bold.cyan(title) + '\n' + chalk_1.default.gray(subtitle), {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'cyan'
        }) + '\n\n';
    }
    generateSummary(result) {
        const { summary } = result;
        const scoreColor = this.getScoreColor(summary.compatibilityScore);
        const summaryData = [
            ['📊 Compatibility Score', chalk_1.default[scoreColor](`${summary.compatibilityScore}%`)],
            ['❌ Errors', chalk_1.default.red(summary.errors.toString())],
            ['⚠️  Warnings', chalk_1.default.yellow(summary.warnings.toString())],
            ['💡 Suggestions', chalk_1.default.blue(summary.suggestions.toString())]
        ];
        const summaryTable = (0, table_1.table)(summaryData, {
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
        return chalk_1.default.bold('📋 Summary\n') + summaryTable + '\n';
    }
    generateSection(title, features) {
        let output = chalk_1.default.bold(title) + '\n\n';
        // Group by file
        const groupedByFile = this.groupByFile(features);
        for (const [file, fileFeatures] of groupedByFile) {
            output += chalk_1.default.underline(`📁 ${this.getRelativePath(file)}`) + '\n';
            for (const feature of fileFeatures) {
                output += this.formatFeature(feature) + '\n';
            }
            output += '\n';
        }
        return output;
    }
    generateModernizationSection(result) {
        let output = chalk_1.default.bold('🔄 Modernization Opportunities') + '\n\n';
        for (const opportunity of result.modernizationOpportunities) {
            const impactIcon = this.getImpactIcon(opportunity.impact);
            const effortIcon = this.getEffortIcon(opportunity.effort);
            output += chalk_1.default.cyan(`${impactIcon} ${opportunity.oldFeature} → ${opportunity.newFeature}`) + '\n';
            output += chalk_1.default.gray(`   Status: ${opportunity.baselineStatus} | Impact: ${opportunity.impact} | Effort: ${opportunity.effort}`) + '\n';
            output += chalk_1.default.white(`   ${opportunity.description}`) + '\n';
            if (opportunity.example) {
                output += chalk_1.default.gray('   Example:') + '\n';
                output += chalk_1.default.dim('   ' + opportunity.example.split('\n').join('\n   ')) + '\n';
            }
            output += '\n';
        }
        return output;
    }
    generateFooter(result) {
        const { summary } = result;
        let recommendations = [];
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
        let footer = chalk_1.default.bold('💡 Recommendations') + '\n\n';
        recommendations.forEach(rec => {
            footer += '   ' + rec + '\n';
        });
        footer += '\n' + chalk_1.default.gray('Learn more about Baseline: https://web.dev/baseline') + '\n';
        footer += chalk_1.default.gray('BaselineFlow: https://github.com/yourusername/baselineflow') + '\n';
        return (0, boxen_1.default)(footer, {
            padding: 1,
            margin: { top: 1 },
            borderStyle: 'round',
            borderColor: 'gray'
        });
    }
    formatFeature(feature) {
        const severityIcon = this.getSeverityIcon(feature.severity);
        const baselineIcon = this.getBaselineIcon(feature.baseline);
        const location = chalk_1.default.gray(`${feature.line}:${feature.column}`);
        let output = `   ${severityIcon} ${baselineIcon} ${chalk_1.default.bold(feature.feature)} ${location}`;
        if (feature.context) {
            output += chalk_1.default.gray(` - ${feature.context.slice(0, 60)}${feature.context.length > 60 ? '...' : ''}`);
        }
        if (feature.suggestion) {
            output += '\n     💡 ' + chalk_1.default.italic(feature.suggestion);
        }
        if (feature.polyfill) {
            output += '\n     🔧 Polyfill: ' + chalk_1.default.cyan(feature.polyfill);
        }
        if (feature.alternative) {
            output += '\n     ↔️  Alternative: ' + chalk_1.default.green(feature.alternative);
        }
        // Browser support
        if (feature.browsers && Object.keys(feature.browsers).length > 0) {
            const browserSupport = this.formatBrowserSupport(feature.browsers);
            output += '\n     🌐 ' + browserSupport;
        }
        return output;
    }
    formatBrowserSupport(browsers) {
        const supportInfo = [];
        if (browsers.chrome)
            supportInfo.push(`Chrome ${browsers.chrome}`);
        if (browsers.firefox)
            supportInfo.push(`Firefox ${browsers.firefox}`);
        if (browsers.safari)
            supportInfo.push(`Safari ${browsers.safari}`);
        if (browsers.edge)
            supportInfo.push(`Edge ${browsers.edge}`);
        return supportInfo.join(' • ');
    }
    groupByFile(features) {
        const grouped = new Map();
        for (const feature of features) {
            if (!grouped.has(feature.file)) {
                grouped.set(feature.file, []);
            }
            grouped.get(feature.file).push(feature);
        }
        return grouped;
    }
    getRelativePath(filePath) {
        const cwd = process.cwd();
        return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
    }
    getSeverityIcon(severity) {
        switch (severity) {
            case 'error': return '🚫';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '❓';
        }
    }
    getBaselineIcon(baseline) {
        switch (baseline) {
            case 'widely-available': return chalk_1.default.green('✅');
            case 'newly-available': return chalk_1.default.yellow('🆕');
            case 'limited': return chalk_1.default.red('⭕');
            default: return chalk_1.default.gray('❓');
        }
    }
    getScoreColor(score) {
        if (score >= 80)
            return 'green';
        if (score >= 60)
            return 'yellow';
        return 'red';
    }
    getImpactIcon(impact) {
        switch (impact) {
            case 'high': return '🔥';
            case 'medium': return '⚡';
            case 'low': return '💡';
            default: return '📌';
        }
    }
    getEffortIcon(effort) {
        switch (effort) {
            case 'low': return '✅';
            case 'medium': return '⚖️';
            case 'high': return '🔨';
            default: return '📋';
        }
    }
}
exports.ConsoleReporter = ConsoleReporter;
//# sourceMappingURL=ConsoleReporter.js.map