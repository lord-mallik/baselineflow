#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const Analyzer_1 = require("./core/Analyzer");
const ConsoleReporter_1 = require("./reporters/ConsoleReporter");
const JSONReporter_1 = require("./reporters/JSONReporter");
const program = new commander_1.Command();
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
    .action(async (projectPath, options) => {
    try {
        const config = await loadConfig(options);
        await runAnalysis(projectPath, config, options);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk_1.default.red('❌ Error:'), message);
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
    .action(async (projectPath, options) => {
    try {
        const config = await loadConfig(options);
        config.reportFormat = 'json'; // Force JSON in CI mode
        const result = await runAnalysis(projectPath, config, options);
        // Exit with appropriate code for CI
        if (options.failOnError && result.summary.errors > 0) {
            console.error(chalk_1.default.red(`❌ Found ${result.summary.errors} compatibility errors`));
            process.exit(1);
        }
        if (options.failOnWarning && result.summary.warnings > 0) {
            console.error(chalk_1.default.yellow(`⚠️  Found ${result.summary.warnings} compatibility warnings`));
            process.exit(1);
        }
        console.log(chalk_1.default.green('✅ Baseline compatibility check passed'));
        process.exit(0);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk_1.default.red('❌ CI Error:'), message);
        process.exit(1);
    }
});
async function loadConfig(options) {
    let config = {};
    // Load from config file if specified
    if (options.config) {
        try {
            const configPath = path.resolve(options.config);
            const configContent = await fs.readFile(configPath, 'utf8');
            if (configPath.endsWith('.json')) {
                config = JSON.parse(configContent);
            }
            else if (configPath.endsWith('.js')) {
                // Dynamic import for JS config
                const configModule = await Promise.resolve(`${configPath}`).then(s => __importStar(require(s)));
                config = configModule.default || configModule;
            }
        }
        catch (error) {
            console.warn(chalk_1.default.yellow('⚠️  Failed to load config file, using defaults'));
        }
    }
    else {
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
                }
                else {
                    const configModule = await Promise.resolve(`${configPath}`).then(s => __importStar(require(s)));
                    config = configModule.default || configModule;
                }
                break;
            }
            catch {
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
    };
}
async function runAnalysis(projectPath, config, options) {
    const absolutePath = path.resolve(projectPath);
    // Verify path exists
    try {
        await fs.access(absolutePath);
    }
    catch {
        throw new Error(`Path does not exist: ${absolutePath}`);
    }
    const spinner = (0, ora_1.default)('🔍 Analyzing project...').start();
    try {
        const analyzer = new Analyzer_1.Analyzer(config);
        const result = await analyzer.analyzeProject(absolutePath);
        spinner.succeed(`Analysis complete! Found ${result.totalFeatures} features in ${result.totalFiles} files`);
        await generateReport(result, config, options);
        return result;
    }
    catch (error) {
        spinner.fail('Analysis failed');
        throw error;
    }
}
async function generateReport(result, config, options) {
    let reportContent;
    switch (config.reportFormat) {
        case 'json':
            const jsonReporter = new JSONReporter_1.JSONReporter();
            reportContent = jsonReporter.generateReport(result);
            break;
        case 'console':
        default:
            const consoleReporter = new ConsoleReporter_1.ConsoleReporter();
            reportContent = consoleReporter.generateReport(result);
            break;
    }
    if (config.outputFile) {
        await fs.writeFile(config.outputFile, reportContent);
        console.log(chalk_1.default.green(`📝 Report saved to ${config.outputFile}`));
    }
    else {
        console.log(reportContent);
    }
}
async function initializeConfig(options) {
    const configPath = 'baselineflow.config.json';
    // Check if config already exists
    try {
        await fs.access(configPath);
        if (!options.force) {
            console.log(chalk_1.default.yellow('⚠️  Configuration file already exists. Use --force to overwrite.'));
            return;
        }
    }
    catch {
        // File doesn't exist, proceed
    }
    const defaultConfig = {
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
    console.log(chalk_1.default.green(`✅ Created configuration file: ${configPath}`));
    console.log(chalk_1.default.gray('Edit the file to customize your settings.'));
}
// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('❌ Unhandled Rejection at:'), promise, chalk_1.default.red('reason:'), reason);
    process.exit(1);
});
program.parse();
//# sourceMappingURL=cli.js.map