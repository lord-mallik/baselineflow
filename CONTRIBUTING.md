# Contributing to BaselineFlow

Thank you for your interest in contributing to BaselineFlow! This document provides guidelines and information for contributors.

## 🎯 Project Goals

BaselineFlow aims to:
- Make web feature compatibility checking effortless for developers
- Integrate Baseline standards into existing development workflows
- Provide actionable guidance for progressive enhancement
- Support the web platform's evolution through better tooling

## 🚀 Getting Started

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/baselineflow.git
   cd baselineflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Test the CLI locally**
   ```bash
   npm run dev -- ./examples/sample-project
   ```

### Project Structure

```
baselineflow/
├── src/
│   ├── core/           # Core analysis logic
│   ├── analyzers/      # File type analyzers
│   ├── reporters/      # Output formatters
│   ├── types/          # TypeScript definitions
│   ├── cli.ts          # CLI interface
│   └── action.ts       # GitHub Action
├── tests/              # Test files
├── examples/           # Sample projects for testing
├── scripts/            # Build and utility scripts
└── docs/               # Documentation
```

## 🛠 Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the existing style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Test with examples**
   ```bash
   node dist/cli.js ./examples/sample-project --format json
   ```

### Code Style

- **TypeScript**: All code should be written in TypeScript
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code formatting is handled by Prettier
- **Naming**: Use descriptive names for functions and variables
- **Comments**: Add JSDoc comments for public APIs

### Testing

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test CLI and full workflows
- **Coverage**: Maintain minimum 80% test coverage
- **Test Data**: Use the `examples/` directory for test projects

## 📝 Pull Request Process

1. **Update documentation** if you've made API changes
2. **Add or update tests** for your changes
3. **Ensure all tests pass** and linting is clean
4. **Write a clear PR description** explaining your changes
5. **Link to any related issues**

### PR Template

```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Reporting Issues

### Bug Reports

Please include:
- **Environment**: OS, Node.js version, npm version
- **Command**: Exact command that failed
- **Error**: Full error message and stack trace
- **Sample**: Minimal code sample that reproduces the issue
- **Expected**: What you expected to happen
- **Actual**: What actually happened

### Feature Requests

Please include:
- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions considered
- **Use Case**: Real-world use case examples

## 🔧 Architecture Guidelines

### Adding New Analyzers

To add support for a new file type:

1. **Create analyzer class** in `src/analyzers/`
   ```typescript
   export class NewAnalyzer {
     constructor(private baselineChecker: BaselineChecker) {}
     
     async analyze(content: string, filePath: string): Promise<FileAnalysis> {
       // Implementation
     }
   }
   ```

2. **Register in main analyzer**
   ```typescript
   // In src/core/Analyzer.ts
   private async analyzeFile(filePath: string): Promise<FileAnalysis> {
     if (filePath.endsWith('.new')) {
       return await this.newAnalyzer.analyze(content, filePath);
     }
   }
   ```

3. **Add tests**
   ```typescript
   // In tests/NewAnalyzer.test.ts
   describe('NewAnalyzer', () => {
     // Test cases
   });
   ```

### Adding New Features

1. **Update types** in `src/types/index.ts`
2. **Implement core logic** in appropriate modules
3. **Add CLI options** in `src/cli.ts` if needed
4. **Update GitHub Action** in `action.yml` if needed
5. **Add tests** and update documentation

### Adding New Reporters

1. **Create reporter class** in `src/reporters/`
   ```typescript
   export class NewReporter {
     generateReport(result: AnalysisResult): string {
       // Implementation
     }
   }
   ```

2. **Register in CLI** and update format options

## 📚 Resources

### Web Platform Baseline
- [Baseline Documentation](https://web.dev/baseline)
- [web-features Package](https://github.com/web-platform-dx/web-features)
- [Web Platform Dashboard](https://webstatus.dev/)

### Development Tools
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🤝 Community

### Communication
- **Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: [Join our Discord](https://discord.gg/baselineflow) (if available)

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read and follow it in all interactions.

## 🎉 Recognition

Contributors are recognized in:
- **GitHub Contributors**: Automatic recognition on GitHub
- **Changelog**: Major contributors mentioned in releases
- **Website**: Contributors page (if applicable)

## 📄 License

By contributing to BaselineFlow, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to BaselineFlow!** Your efforts help make web development more accessible and compatible for everyone. 🌐✨