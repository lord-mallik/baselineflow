"use strict";
/**
 * GitHub Action entry point for BaselineFlow
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const Analyzer_1 = require("./core/Analyzer");
const JSONReporter_1 = require("./reporters/JSONReporter");
async function run() {
    try {
        // Get inputs
        const projectPath = core.getInput('path') || '.';
        const configPath = core.getInput('config');
        const target = core.getInput('target') || 'widely-available';
        const failOnError = core.getBooleanInput('fail-on-error');
        const failOnWarning = core.getBooleanInput('fail-on-warning');
        const outputFile = core.getInput('output-file') || 'baselineflow-report.json';
        const ignorePatterns = core.getInput('ignore-patterns');
        const framework = core.getInput('framework') || 'auto';
        core.info(`🚀 Starting BaselineFlow analysis...`);
        core.info(`📂 Analyzing path: ${projectPath}`);
        core.info(`🎯 Target: ${target}`);
        // Load configuration
        const config = await loadConfiguration(configPath, {
            target: target,
            failOnError,
            failOnWarning,
            outputFile,
            ignorePatterns: ignorePatterns ? ignorePatterns.split(',').map((p) => p.trim()) : [],
            framework: framework
        });
        // Run analysis
        const analyzer = new Analyzer_1.Analyzer(config);
        const result = await analyzer.analyzeProject(path.resolve(projectPath));
        core.info(`✅ Analysis complete!`);
        core.info(`📊 Found ${result.totalFeatures} features in ${result.totalFiles} files`);
        core.info(`🎯 Compatibility score: ${result.summary.compatibilityScore}%`);
        // Generate report
        const reporter = new JSONReporter_1.JSONReporter();
        const reportContent = reporter.generateReport(result);
        await fs.writeFile(outputFile, reportContent);
        core.info(`📝 Report saved to: ${outputFile}`);
        // Set outputs
        core.setOutput('compatibility-score', result.summary.compatibilityScore);
        core.setOutput('errors-count', result.summary.errors);
        core.setOutput('warnings-count', result.summary.warnings);
        core.setOutput('report-file', outputFile);
        // Create summary
        await createSummary(result, outputFile);
        // Handle failure conditions
        if (failOnError && result.summary.errors > 0) {
            core.setFailed(`❌ Found ${result.summary.errors} compatibility errors`);
            return;
        }
        if (failOnWarning && result.summary.warnings > 0) {
            core.setFailed(`⚠️ Found ${result.summary.warnings} compatibility warnings`);
            return;
        }
        core.info(`🎉 BaselineFlow analysis completed successfully!`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.setFailed(`❌ BaselineFlow analysis failed: ${errorMessage}`);
    }
}
async function loadConfiguration(configPath, inputs) {
    let config = {};
    // Load from config file if provided
    if (configPath) {
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(configContent);
            core.info(`📋 Loaded configuration from: ${configPath}`);
        }
        catch (error) {
            core.warning(`⚠️ Failed to load config file: ${configPath}`);
        }
    }
    // Merge with inputs
    return {
        target: inputs.target || config.target || 'widely-available',
        browsers: config.browsers || ['chrome', 'firefox', 'safari', 'edge'],
        exceptions: config.exceptions || [],
        ignoreFiles: [
            ...(config.ignoreFiles || []),
            ...inputs.ignorePatterns,
            'node_modules/**',
            'dist/**',
            'build/**'
        ],
        framework: inputs.framework || config.framework || 'auto',
        generateFixes: config.generateFixes || true,
        reportFormat: 'json'
    };
}
async function createSummary(result, reportFile) {
    const summary = core.summary;
    summary.addHeading('🚀 BaselineFlow Analysis Report', 1);
    // Summary table
    summary.addTable([
        [
            { data: '📊 Metric', header: true },
            { data: '📈 Value', header: true }
        ],
        ['Compatibility Score', `${result.summary.compatibilityScore}%`],
        ['Files Analyzed', result.totalFiles.toString()],
        ['Features Found', result.totalFeatures.toString()],
        ['❌ Errors', result.summary.errors.toString()],
        ['⚠️ Warnings', result.summary.warnings.toString()],
        ['💡 Suggestions', result.summary.suggestions.toString()]
    ]);
    // Violations section
    if (result.violations.length > 0) {
        summary.addHeading('❌ Compatibility Violations', 2);
        const violationRows = [
            [
                { data: 'Feature', header: true },
                { data: 'File', header: true },
                { data: 'Line', header: true },
                { data: 'Baseline Status', header: true }
            ]
        ];
        result.violations.slice(0, 10).forEach((violation) => {
            violationRows.push([
                violation.feature,
                path.basename(violation.file),
                violation.line.toString(),
                violation.baseline || 'unknown'
            ]);
        });
        if (result.violations.length > 10) {
            violationRows.push([
                { data: `... and ${result.violations.length - 10} more`, header: false }
            ]);
        }
        summary.addTable(violationRows);
    }
    // Modernization opportunities
    if (result.modernizationOpportunities.length > 0) {
        summary.addHeading('🔄 Modernization Opportunities', 2);
        result.modernizationOpportunities.forEach((opportunity) => {
            summary.addDetails(`${opportunity.oldFeature} → ${opportunity.newFeature}`, `**Impact:** ${opportunity.impact} | **Effort:** ${opportunity.effort}\n\n${opportunity.description}`);
        });
    }
    // Links
    summary.addHeading('🔗 Resources', 2);
    summary.addList([
        '[Web Platform Baseline](https://web.dev/baseline)',
        '[MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/Guide/Cross-browser_compatibility)',
        `[Full Report](${reportFile})`
    ]);
    await summary.write();
}
// Run the action
if (require.main === module) {
    run();
}
//# sourceMappingURL=action.js.map