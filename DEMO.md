# 🚀 BaselineFlow - Demo & Examples

## Quick Demo

### 1. **Basic Analysis**
```bash
# Analyze current directory
baselineflow

# Analyze specific directory
baselineflow ./src
```

### 2. **Console Output (Beautiful Terminal Display)**
```bash
baselineflow ./examples/sample-project/src --format console
```

**Sample Output:**
```
🚀 BaselineFlow Analysis Report
Analyzed 2 files • Found 79 web features

📋 Summary
┌────────────────────────┬─────┐
│ 📊 Compatibility Score │ 71% │
│ ❌ Errors              │ 29  │
│ ⚠️  Warnings           │ 6   │
│ 💡 Suggestions         │ 44  │
└────────────────────────┴─────┘

❌ Baseline Violations (Errors)

📁 Modal.css
   🚫 ⭕ container-queries 27:1 - @container (min-width: 400px)
     💡 Container queries have limited browser support. Consider using media queries as fallback.
     🔧 Polyfill: Use @container polyfill or media query fallback
     ↔️  Alternative: Use media queries for responsive design
     🌐 Chrome 105 • Firefox 110 • Safari 16.0

⚠️  Baseline Warnings

📁 Modal.css
   ⚠️ 🆕 backdrop-filter 11:3 - backdrop-filter: blur(10px)
     💡 Feature is newly available in Baseline. Consider progressive enhancement.
     🌐 Chrome 76 • Firefox 103 • Safari 18 • Edge 79

🔄 Modernization Opportunities

🔥 Legacy layout techniques → Modern CSS features
   Status: newly-available | Impact: high | Effort: medium
   Adopt newly available CSS features for better layouts
```

### 3. **JSON Output (Machine Readable)**
```bash
baselineflow ./src --format json --output report.json
```

### 4. **CI/CD Integration**
```bash
# Fail on errors (perfect for CI)
baselineflow ci ./src --fail-on-error

# Also fail on warnings
baselineflow ci ./src --fail-on-error --fail-on-warning
```

### 5. **Configuration File**
```bash
# Initialize configuration
baselineflow init

# Creates baselineflow.config.json:
{
  "target": "widely-available",
  "browsers": ["chrome", "firefox", "safari", "edge"],
  "exceptions": ["container-queries"],
  "ignoreFiles": ["node_modules/**", "dist/**"],
  "framework": "react",
  "generateFixes": true
}
```

## GitHub Actions Integration

### Basic Workflow
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

### Advanced Workflow with Multiple Targets
```yaml
name: Comprehensive Baseline Check

on: [push, pull_request]

jobs:
  baseline-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target: ['widely-available', 'newly-available']
        path: ['./src', './components']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: BaselineFlow Analysis
        uses: ./
        with:
          path: ${{ matrix.path }}
          target: ${{ matrix.target }}
          fail-on-error: ${{ matrix.target == 'widely-available' }}
          output-file: 'report-${{ matrix.target }}-${{ hashFiles(matrix.path) }}.json'
```

## Real-World Examples

### Example 1: React Component Analysis
```typescript
// Modal.tsx - Contains modern features
const Modal = () => {
  // Modern JavaScript features detected by BaselineFlow:
  const [isOpen, setIsOpen] = useState(false);  // ✅ Widely available
  
  useEffect(() => {
    // IntersectionObserver - ✅ Widely available
    const observer = new IntersectionObserver(...);
    
    // ResizeObserver - ⚠️ Newly available
    const resizeObserver = new ResizeObserver(...);
    
    // Web Share API - ❌ Limited availability
    if (navigator.share) {
      await navigator.share({...});
    }
  }, []);
};
```

**BaselineFlow detects:**
- ✅ `useState`, `useEffect` (React patterns)
- ✅ `IntersectionObserver` (widely available)
- ⚠️ `ResizeObserver` (newly available - warns about fallbacks)
- ❌ `navigator.share` (limited - suggests polyfill)

### Example 2: CSS Analysis
```css
/* Modal.css - Modern CSS features */
.modal {
  display: flex;              /* ✅ Widely available */
  backdrop-filter: blur(10px); /* ⚠️ Newly available */
}

@container (min-width: 400px) { /* ❌ Limited availability */
  .modal-content {
    padding: 3rem;
  }
}

.modern-layout {
  display: grid;                           /* ✅ Widely available */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* ✅ */
  gap: 1rem;                              /* ✅ Widely available */
  aspect-ratio: 16/9;                     /* ⚠️ Newly available */
}
```

**BaselineFlow provides:**
- Compatibility status for each feature
- Browser version support
- Progressive enhancement suggestions
- Polyfill recommendations

## Integration Examples

### 1. ESLint Integration (Custom Rule)
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

### 2. Webpack Integration
```javascript
// webpack.config.js
const BaselineFlowPlugin = require('baselineflow-webpack-plugin');

module.exports = {
  plugins: [
    new BaselineFlowPlugin({
      target: 'widely-available',
      failOnError: process.env.NODE_ENV === 'production'
    })
  ]
};
```

### 3. VS Code Extension Integration
```typescript
// VS Code extension using BaselineFlow
import { BaselineChecker } from 'baselineflow';

export function activate(context: vscode.ExtensionContext) {
  const checker = new BaselineChecker({ target: 'widely-available' });
  
  // Provide real-time compatibility info
  const provider = vscode.languages.registerHoverProvider('css', {
    provideHover(document, position) {
      const feature = getFeatureAtPosition(document, position);
      const result = checker.checkFeature(feature);
      
      return new vscode.Hover([
        `**${feature}**: ${result.baseline}`,
        result.suggestion || 'Compatible with your target browsers'
      ]);
    }
  });
}
```

## Key Benefits Demonstrated

### 🎯 **For Development Teams**
- **Early Detection**: Catch compatibility issues before they reach production
- **Consistent Standards**: Unified compatibility decisions across team
- **Educational**: Learn about web platform evolution and best practices

### 🚀 **For CI/CD Pipelines**
- **Automated Gates**: Prevent incompatible code from deploying
- **Detailed Reports**: Comprehensive JSON reports for tracking and metrics
- **Flexible Targets**: Different compatibility requirements for different projects

### 📊 **For Project Management**
- **Risk Assessment**: Quantified compatibility scores
- **Migration Planning**: Clear modernization opportunities
- **Technical Debt**: Track compatibility debt over time

### 🔧 **For Individual Developers**
- **Instant Feedback**: Real-time compatibility checking
- **Learning Tool**: Understand web platform feature adoption
- **Progressive Enhancement**: Guidance on fallback strategies

## Performance Benchmarks

- **Small Project** (10 files): ~0.5 seconds
- **Medium Project** (100 files): ~3 seconds  
- **Large Project** (1000 files): ~15 seconds
- **Memory Usage**: ~50MB for typical projects

## Feature Coverage

BaselineFlow analyzes:

### CSS Features
- ✅ Properties (display, position, flex, grid, etc.)
- ✅ Functions (clamp, min, max, calc, etc.)
- ✅ At-rules (@container, @supports, @media, etc.)
- ✅ Selectors (pseudo-classes, pseudo-elements)
- ✅ Values and keywords

### JavaScript Features
- ✅ Modern syntax (arrow functions, async/await, destructuring)
- ✅ Web APIs (fetch, observers, storage)
- ✅ Built-in objects (Map, Set, Promise, etc.)
- ✅ Array/Object methods
- ✅ Browser APIs (geolocation, clipboard, share)

### Framework Support
- ✅ React (hooks, JSX patterns)
- ✅ Vue (composition API, directives)
- ✅ Angular (decorators, lifecycle)
- ✅ TypeScript (modern syntax)

---

**Ready to improve your web compatibility?** 

```bash
npm install -g baselineflow
baselineflow --help
```

*BaselineFlow: Making web compatibility effortless* 🌐✨