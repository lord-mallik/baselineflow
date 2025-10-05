#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { BaselineConfig } from './types';
import { Analyzer } from './core/Analyzer';
import { ConsoleReporter } from './reporters/ConsoleReporter';
import { JSONReporter } from './reporters/JSONReporter';

const program = new Command();

program
  .name('baselineflow')
  .description('AI-powered CI/CD integration for Baseline web feature validation')
  .version('1.0.0');

program
  .argument('[path]', 'Path to analyze (defaults to current directory)', '.')
  .option('-c, --config <file>', 'Configuration file path')
  .option('-t, --target <target>', 'Baseline target: widely-available, newly-available, limited', 'widely-available')
  .option('-f, --format <format>', 'Output format: console, json, html', 'console')
  .option('-o, --output <file>', 'Output file (defaults to stdout)')
  .option('--framework <framework>', 'Framework hint: react, vue, angular, svelte, auto')
  .option('--generate-fixes', 'Generate fix suggestions', false)
  .option('--ignore <patterns...>', 'Patterns to ignore')
  .option('--no-color', 'Disable colored output')
  .option('--verbose', 'Verbose output')
  .action(async (projectPath: string, options) => {
    try {
      const config = await loadConfig(options);
      await runAnalysis(projectPath, config, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('❌ Error:'), message);
      process.exit(1);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize BaselineFlow configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    await initializeConfig(options);
  });

// CI command for integration
program
  .command('ci')
  .description('Run in CI mode with strict checking')
  .argument('[path]', 'Path to analyze', '.')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--fail-on-error', 'Exit with error code if violations found', true)
  .option('--fail-on-warning', 'Exit with error code if warnings found', false)
  .action(async (projectPath: string, options) => {
    try {
      const config = await loadConfig(options);
      config.reportFormat = 'json'; // Force JSON in CI mode
      
      const result = await runAnalysis(projectPath, config, options);
      
      // Exit with appropriate code for CI
      if (options.failOnError && result.summary.errors > 0) {
        console.error(chalk.red(`❌ Found ${result.summary.errors} compatibility errors`));
        process.exit(1);
      }
      
      if (options.failOnWarning && result.summary.warnings > 0) {
        console.error(chalk.yellow(`⚠️  Found ${result.summary.warnings} compatibility warnings`));
        process.exit(1);
      }
      
      console.log(chalk.green('✅ Baseline compatibility check passed'));
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('❌ CI Error:'), message);
      process.exit(1);
    }
  });

async function loadConfig(options: any): Promise<BaselineConfig> {
  let config: Partial<BaselineConfig> = {};
  
  // Load from config file if specified
  if (options.config) {
    try {
      const configPath = path.resolve(options.config);
      const configContent = await fs.readFile(configPath, 'utf8');
      
      if (configPath.endsWith('.json')) {
        config = JSON.parse(configContent);
      } else if (configPath.endsWith('.js')) {
        // Dynamic import for JS config
        const configModule = await import(configPath);
        config = configModule.default || configModule;
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to load config file, using defaults'));
    }
  } else {
    // Try to load default config files
    const defaultConfigs = [
      'baselineflow.config.json',
      'baselineflow.config.js',
      '.baselineflowrc.json',
      '.baselineflowrc.js'
    ];
    
    for (const configFile of defaultConfigs) {
      try {
        const configPath = path.resolve(configFile);
        await fs.access(configPath);
        
        const configContent = await fs.readFile(configPath, 'utf8');
        if (configFile.endsWith('.json')) {
          config = JSON.parse(configContent);
        } else {
          const configModule = await import(configPath);
          config = configModule.default || configModule;
        }
        break;
      } catch {
        // Continue to next config file
      }
    }
  }
  
  // Merge with CLI options and defaults
  return {
    target: options.target || config.target || 'widely-available',
    browsers: config.browsers || ['chrome', 'firefox', 'safari', 'edge'],
    exceptions: config.exceptions || [],
    ignoreFiles: [...(config.ignoreFiles || []), ...(options.ignore || [])],
    framework: options.framework || config.framework || 'auto',
    generateFixes: options.generateFixes || config.generateFixes || false,
    reportFormat: options.format || config.reportFormat || 'console',
    outputFile: options.output || config.outputFile
  } as BaselineConfig;
}

async function runAnalysis(projectPath: string, config: BaselineConfig, options: any) {
  const absolutePath = path.resolve(projectPath);
  
  // Verify path exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }
  
  const spinner = ora('🔍 Analyzing project...').start();
  
  try {
    const analyzer = new Analyzer(config);
    const result = await analyzer.analyzeProject(absolutePath);
    
    spinner.succeed(`Analysis complete! Found ${result.totalFeatures} features in ${result.totalFiles} files`);
    
    await generateReport(result, config, options);
    
    return result;
  } catch (error) {
    spinner.fail('Analysis failed');
    throw error;
  }
}

async function generateReport(result: any, config: BaselineConfig, options: any) {
  let reportContent: string;
  
  switch (config.reportFormat) {
    case 'json':
      const jsonReporter = new JSONReporter();
      reportContent = jsonReporter.generateReport(result);
      break;
    case 'console':
    default:
      const consoleReporter = new ConsoleReporter();
      reportContent = consoleReporter.generateReport(result);
      break;
  }
  
  if (config.outputFile) {
    await fs.writeFile(config.outputFile, reportContent);
    console.log(chalk.green(`📝 Report saved to ${config.outputFile}`));
  } else {
    console.log(reportContent);
  }
}

async function initializeConfig(options: any) {
  const configPath = 'baselineflow.config.json';
  
  // Check if config already exists
  try {
    await fs.access(configPath);
    if (!options.force) {
      console.log(chalk.yellow('⚠️  Configuration file already exists. Use --force to overwrite.'));
      return;
    }
  } catch {
    // File doesn't exist, proceed
  }
  
  const defaultConfig: BaselineConfig = {
    target: 'widely-available',
    browsers: ['chrome', 'firefox', 'safari', 'edge'],
    exceptions: [],
    ignoreFiles: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.min.css'
    ],
    framework: 'auto',
    generateFixes: true,
    reportFormat: 'console'
  };
  
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log(chalk.green(`✅ Created configuration file: ${configPath}`));
  console.log(chalk.gray('Edit the file to customize your settings.'));
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

program.parse();