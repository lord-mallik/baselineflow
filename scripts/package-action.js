/**
 * Script to package the GitHub Action with dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Packaging GitHub Action...');

// Install ncc if not present
try {
  execSync('npx @vercel/ncc --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing @vercel/ncc...');
  execSync('npm install -g @vercel/ncc');
}

// Build the action
console.log('🔨 Building action bundle...');
execSync('npx @vercel/ncc build src/action.ts -o dist/action --source-map', {
  stdio: 'inherit'
});

// Copy necessary files
const filesToCopy = [
  'action.yml',
  'README.md',
  'LICENSE'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`✅ Copied ${file}`);
  }
});

// Create action entry point
const actionEntry = `
const { run } = require('./action/index.js');

if (require.main === module) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
`;

fs.writeFileSync(path.join('dist', 'index.js'), actionEntry);

console.log('✅ GitHub Action packaged successfully!');
console.log('📁 Files are ready in ./dist/');
console.log('🚀 Action can now be used in workflows');