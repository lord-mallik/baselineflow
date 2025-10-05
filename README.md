# 🚀 BaselineFlow

**AI-powered CI/CD integration for Baseline web feature validation**

BaselineFlow is a comprehensive tool that automatically validates your web application's compatibility with [Web Platform Baseline](https://web.dev/baseline) standards. It integrates seamlessly into your development workflow, providing instant feedback on browser compatibility and suggesting modern alternatives.

## ✨ Features

- 🔍 **Automatic Feature Detection** - Scans CSS, JavaScript, and TypeScript files for web platform features
- 🎯 **Baseline Compatibility Checking** - Validates features against Baseline "widely available" and "newly available" standards  
- 🤖 **AI-Powered Suggestions** - Provides intelligent recommendations for polyfills, alternatives, and progressive enhancement
- 🚀 **CI/CD Integration** - GitHub Actions support with detailed reporting
- 📊 **Comprehensive Reporting** - Console, JSON, and HTML report formats
- 🔧 **Framework Awareness** - Optimized analysis for React, Vue, Angular, and other frameworks
- ⚡ **Performance Optimized** - Fast analysis with parallel processing

## 🎯 Why BaselineFlow?

Web developers spend countless hours researching browser compatibility, jumping between MDN, Can I Use, and various documentation sites. **BaselineFlow eliminates this friction** by bringing Baseline compatibility data directly into your development workflow.

### The Problem
- ❌ Manual compatibility checking is time-consuming and error-prone
- ❌ Developers often discover compatibility issues late in development
- ❌ Inconsistent compatibility decisions across team members
- ❌ Lack of guidance on progressive enhancement strategies

### The Solution
- ✅ **Automated compatibility validation** in your CI/CD pipeline
- ✅ **Early detection** of compatibility issues during development
- ✅ **Consistent standards** across your entire team
- ✅ **Actionable guidance** for progressive enhancement and polyfills

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g baselineflow

# Or use with npx
npx baselineflow
```

### Basic Usage

```bash
# Analyze current directory
baselineflow

# Analyze specific directory
baselineflow ./src

# Generate JSON report
baselineflow --format json --output report.json

# Target newly available features
baselineflow --target newly-available
```

### GitHub Actions Integration

Create `.github/workflows/baseline-check.yml`:

```yaml
name: Baseline Compatibility Check

on: [push, pull_request]

jobs:
  baseline-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run BaselineFlow
        uses: ./
        with:
          path: './src'
          target: 'widely-available'
          fail-on-error: true
          output-file: 'baseline-report.json'
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: baseline-report
          path: baseline-report.json
```

## 📋 Configuration

Create `baselineflow.config.json`:

```json
{
  "target": "widely-available",
  "browsers": ["chrome", "firefox", "safari", "edge"],
  "exceptions": ["css-grid", "flexbox"],
  "ignoreFiles": [
    "node_modules/**",
    "dist/**",
    "**/*.min.js"
  ],
  "framework": "react",
  "generateFixes": true,
  "reportFormat": "console"
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | string | `"widely-available"` | Baseline target: `widely-available`, `newly-available`, `limited` |
| `browsers` | string[] | `["chrome", "firefox", "safari", "edge"]` | Target browsers for compatibility |
| `exceptions` | string[] | `[]` | Features to allow regardless of baseline status |
| `ignoreFiles` | string[] | `[]` | File patterns to ignore during analysis |
| `framework` | string | `"auto"` | Framework hint: `react`, `vue`, `angular`, `svelte`, `auto` |
| `generateFixes` | boolean | `false` | Generate fix suggestions and polyfill recommendations |
| `reportFormat` | string | `"console"` | Output format: `console`, `json`, `html` |

## 📊 Example Output

### Console Report
```
🚀 BaselineFlow Analysis Report
Analyzed 24 files • Found 156 web features

📋 Summary
┌─────────────────────────┬────────┐
│ 📊 Compatibility Score  │ 87%    │
│ ❌ Errors              │ 3      │
│ ⚠️  Warnings           │ 12     │
│ 💡 Suggestions         │ 8      │
└─────────────────────────┴────────┘

❌ Baseline Violations (Errors)

📁 src/components/Modal.css
   🚫 ⭕ container-queries 45:12 - @container (min-width: 400px)
     💡 Container queries have limited browser support. Consider using media queries as fallback.
     🔧 Polyfill: Use @container polyfill or media query fallback
     ↔️  Alternative: Use media queries for responsive design
     🌐 Chrome 105 • Firefox 110 • Safari 16.0

🔄 Modernization Opportunities

🔥 Float-based layouts → CSS Grid/Flexbox
   Status: widely-available | Impact: high | Effort: medium
   Replace float-based layouts with modern CSS Grid or Flexbox for better responsive design
```

## 🔧 Advanced Features

### Progressive Enhancement Generation

BaselineFlow can automatically generate progressive enhancement code:

```bash
baselineflow --generate-fixes
```

Example output:
```css
.grid-container {
  display: flex; /* fallback */
  flex-wrap: wrap;
}

@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
}
```

### Framework-Specific Analysis

BaselineFlow provides enhanced analysis for popular frameworks:

```bash
# React-specific analysis
baselineflow --framework react

# Vue-specific analysis  
baselineflow --framework vue

# Auto-detect framework
baselineflow --framework auto
```

## 🤝 Integration Examples

### ESLint Integration

Create a custom ESLint rule that uses BaselineFlow:

```javascript
// eslint-plugin-baseline.js
const { BaselineChecker } = require('baselineflow');

module.exports = {
  rules: {
    'baseline-compatibility': {
      create(context) {
        const checker = new BaselineChecker({ target: 'widely-available' });
        
        return {
          CallExpression(node) {
            if (node.callee.name === 'fetch') {
              const result = checker.checkFeature('fetch');
              if (!result.meetsCriteria) {
                context.report({
                  node,
                  message: `Feature 'fetch' is ${result.baseline}. ${result.suggestion}`
                });
              }
            }
          }
        };
      }
    }
  }
};
```

### Webpack Integration

```javascript
// webpack.config.js
const BaselineFlowPlugin = require('baselineflow-webpack-plugin');

module.exports = {
  plugins: [
    new BaselineFlowPlugin({
      target: 'widely-available',
      failOnError: true
    })
  ]
};
```

## 📈 Metrics & Analytics

BaselineFlow provides detailed metrics for tracking your project's compatibility over time:

- **Compatibility Score**: Overall percentage of features that meet your baseline target
- **Risk Assessment**: Identification of high-risk compatibility issues
- **Modernization Opportunities**: Suggestions for adopting newer, better-supported features
- **Browser Support Matrix**: Detailed breakdown of feature support across browsers

## 🌟 Use Cases

### Development Team Workflows
- **Pre-commit hooks** to catch compatibility issues early
- **Code review assistance** with automatic compatibility annotations
- **Technical debt tracking** through compatibility score monitoring

### CI/CD Pipelines
- **Automated compatibility gates** before deployment
- **Progressive enhancement validation** for feature flags
- **Cross-browser testing optimization** based on actual feature usage

### Enterprise Applications
- **Compliance reporting** for browser support requirements
- **Risk assessment** for legacy browser deprecation
- **Migration planning** from legacy to modern web features

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/yourusername/baselineflow.git
cd baselineflow
npm install
npm run build
npm run test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Web Platform Baseline](https://web.dev/baseline) initiative by Google and the WebDX Community Group
- [web-features](https://github.com/web-platform-dx/web-features) data package
- [Web Platform Dashboard](https://webstatus.dev/) for compatibility data

## 📞 Support

- 📖 [Documentation](https://github.com/yourusername/baselineflow/wiki)
- 🐛 [Issue Tracker](https://github.com/yourusername/baselineflow/issues)
- 💬 [Discussions](https://github.com/yourusername/baselineflow/discussions)
- 📧 [Email Support](mailto:support@baselineflow.dev)

---

**Made with ❤️ for the Web Platform Community**

*BaselineFlow helps developers build more compatible, accessible, and future-proof web applications by leveraging the power of Web Platform Baseline standards.*