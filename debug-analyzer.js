// Debug analyzer issues
const { BaselineChecker } = require('./dist/core/BaselineChecker');
const { CSSAnalyzer } = require('./dist/analyzers/CSSAnalyzer');
const { SimpleJavaScriptAnalyzer } = require('./dist/analyzers/SimpleJavaScriptAnalyzer');
const fs = require('fs');

async function testAnalyzers() {
  const config = {
    target: 'widely-available',
    browsers: ['chrome', 'firefox', 'safari', 'edge'],
    exceptions: [],
    ignoreFiles: [],
    generateFixes: false,
    reportFormat: 'console'
  };

  const checker = new BaselineChecker(config);
  
  // Test baseline checker
  console.log('Testing BaselineChecker...');
  const flexResult = checker.checkFeature('flexbox');
  console.log('Flexbox result:', flexResult);
  
  const gridResult = checker.checkFeature('css-grid');
  console.log('CSS Grid result:', gridResult);
  
  // Test CSS analyzer
  console.log('\nTesting CSS Analyzer...');
  const cssAnalyzer = new CSSAnalyzer(checker);
  
  const cssContent = `
.test {
  display: flex;
  gap: 1rem;
  backdrop-filter: blur(10px);
}

@container (min-width: 400px) {
  .test { padding: 2rem; }
}
`;

  try {
    const cssResult = await cssAnalyzer.analyze(cssContent, 'test.css');
    console.log('CSS Analysis result:', JSON.stringify(cssResult, null, 2));
  } catch (error) {
    console.error('CSS Analysis error:', error);
  }

  // Test JavaScript analyzer
  console.log('\nTesting JavaScript Analyzer...');
  const jsAnalyzer = new SimpleJavaScriptAnalyzer(checker);
  
  const jsContent = `
const data = await fetch('/api/data');
const result = data.json();

const observer = new IntersectionObserver(() => {});
const map = new Map();
const arr = [1, 2, 3].includes(2);
`;

  try {
    const jsResult = await jsAnalyzer.analyze(jsContent, 'test.js');
    console.log('JS Analysis result:', JSON.stringify(jsResult, null, 2));
  } catch (error) {
    console.error('JS Analysis error:', error);
  }
}

testAnalyzers().catch(console.error);