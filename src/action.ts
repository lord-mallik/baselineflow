/**
 * GitHub Action entry point for BaselineFlow
 */

import * as core from '@actions/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaselineConfig } from './types';
import { Analyzer } from './core/Analyzer';
import { JSONReporter } from './reporters/JSONReporter';

async function run(): Promise<void> {
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
      target: target as any,
      failOnError,
      failOnWarning,
      outputFile,
      ignorePatterns: ignorePatterns ? ignorePatterns.split(',').map((p: string) => p.trim()) : [],
      framework: framework as any
    });

    // Run analysis
    const analyzer = new Analyzer(config);
    const result = await analyzer.analyzeProject(path.resolve(projectPath));

    core.info(`✅ Analysis complete!`);
    core.info(`📊 Found ${result.totalFeatures} features in ${result.totalFiles} files`);
    core.info(`🎯 Compatibility score: ${result.summary.compatibilityScore}%`);

    // Generate report
    const reporter = new JSONReporter();
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`❌ BaselineFlow analysis failed: ${errorMessage}`);
  }
}

async function loadConfiguration(configPath: string, inputs: any): Promise<BaselineConfig> {
  let config: Partial<BaselineConfig> = {};

  // Load from config file if provided
  if (configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
      core.info(`📋 Loaded configuration from: ${configPath}`);
    } catch (error) {
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
  } as BaselineConfig;
}

async function createSummary(result: any, reportFile: string): Promise<void> {
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

    result.violations.slice(0, 10).forEach((violation: any) => {
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
    
    result.modernizationOpportunities.forEach((opportunity: any) => {
      summary.addDetails(
        `${opportunity.oldFeature} → ${opportunity.newFeature}`,
        `**Impact:** ${opportunity.impact} | **Effort:** ${opportunity.effort}\n\n${opportunity.description}`
      );
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

export { run };