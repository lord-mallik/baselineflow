"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleJavaScriptAnalyzer = void 0;
/**
 * Simplified JavaScript analyzer using regex patterns
 */
class SimpleJavaScriptAnalyzer {
    constructor(baselineChecker) {
        this.baselineChecker = baselineChecker;
    }
    async analyze(content, filePath) {
        const features = [];
        const lines = content.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineNumber = lineIndex + 1;
            // Analyze line for various web features
            this.analyzeLineForFeatures(line, lineNumber, filePath, features);
        }
        return {
            file: filePath,
            type: this.getFileType(filePath),
            features
        };
    }
    getFileType(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts': return 'typescript';
            case 'tsx': return 'tsx';
            case 'jsx': return 'jsx';
            default: return 'javascript';
        }
    }
    analyzeLineForFeatures(line, lineNumber, filePath, features) {
        // Modern JavaScript syntax
        const syntaxPatterns = [
            { pattern: /=>\s*/, feature: 'arrow-functions', description: 'Arrow function syntax' },
            { pattern: /`[^`]*\$\{[^}]*\}[^`]*`/, feature: 'template-literals', description: 'Template literal with interpolation' },
            { pattern: /\.\.\.[a-zA-Z_$][a-zA-Z0-9_$]*/, feature: 'spread-syntax', description: 'Spread operator' },
            { pattern: /async\s+function/, feature: 'async-functions', description: 'Async function declaration' },
            { pattern: /await\s+/, feature: 'async-await', description: 'Await expression' },
            { pattern: /\?\?/, feature: 'nullish-coalescing', description: 'Nullish coalescing operator' },
            { pattern: /\?\./, feature: 'optional-chaining', description: 'Optional chaining operator' },
            { pattern: /class\s+[a-zA-Z_$][a-zA-Z0-9_$]*/, feature: 'es6-class', description: 'ES6 class declaration' },
            { pattern: /\*\*/, feature: 'exponentiation-operator', description: 'Exponentiation operator' }
        ];
        // Web APIs
        const apiPatterns = [
            { pattern: /fetch\s*\(/, feature: 'fetch', description: 'Fetch API' },
            { pattern: /new\s+Promise\s*\(/, feature: 'promises', description: 'Promise constructor' },
            { pattern: /navigator\.serviceWorker/, feature: 'serviceworker', description: 'Service Worker API' },
            { pattern: /navigator\.geolocation/, feature: 'geolocation', description: 'Geolocation API' },
            { pattern: /navigator\.share/, feature: 'web-share', description: 'Web Share API' },
            { pattern: /navigator\.clipboard/, feature: 'clipboard-api', description: 'Clipboard API' },
            { pattern: /localStorage\.|sessionStorage\./, feature: 'webstorage', description: 'Web Storage API' },
            { pattern: /new\s+IntersectionObserver/, feature: 'intersectionobserver', description: 'Intersection Observer API' },
            { pattern: /new\s+ResizeObserver/, feature: 'resizeobserver', description: 'Resize Observer API' },
            { pattern: /new\s+MutationObserver/, feature: 'mutationobserver', description: 'Mutation Observer API' },
            { pattern: /new\s+AbortController/, feature: 'abortcontroller', description: 'AbortController API' },
            { pattern: /new\s+Map\s*\(/, feature: 'map', description: 'Map constructor' },
            { pattern: /new\s+Set\s*\(/, feature: 'set', description: 'Set constructor' },
            { pattern: /new\s+WeakMap/, feature: 'weakmap', description: 'WeakMap constructor' },
            { pattern: /new\s+WeakSet/, feature: 'weakset', description: 'WeakSet constructor' },
            { pattern: /Symbol\s*\(/, feature: 'symbol', description: 'Symbol constructor' },
            { pattern: /new\s+Proxy/, feature: 'proxy', description: 'Proxy constructor' },
            { pattern: /requestAnimationFrame\s*\(/, feature: 'requestanimationframe', description: 'Request Animation Frame' },
            { pattern: /new\s+URL\s*\(/, feature: 'url', description: 'URL constructor' },
            { pattern: /new\s+URLSearchParams/, feature: 'url-api', description: 'URL Search Params' },
            { pattern: /new\s+FormData/, feature: 'formdata', description: 'FormData constructor' },
            { pattern: /new\s+Blob/, feature: 'blob', description: 'Blob constructor' },
            { pattern: /new\s+FileReader/, feature: 'filereader', description: 'FileReader constructor' },
            { pattern: /new\s+Worker/, feature: 'web-workers', description: 'Web Workers' },
            { pattern: /new\s+WebSocket/, feature: 'websockets', description: 'WebSocket constructor' },
            { pattern: /new\s+EventSource/, feature: 'eventsource', description: 'EventSource constructor' },
            { pattern: /new\s+XMLHttpRequest/, feature: 'xhr', description: 'XMLHttpRequest constructor' }
        ];
        // Array methods
        const arrayMethods = [
            'find', 'findIndex', 'includes', 'entries', 'keys', 'values',
            'map', 'filter', 'reduce', 'forEach', 'some', 'every',
            'flat', 'flatMap', 'from', 'of'
        ];
        arrayMethods.forEach(method => {
            const pattern = new RegExp(`\\.${method}\\s*\\(`);
            if (pattern.test(line)) {
                this.addFeature(`array-${method}`, line, lineNumber, filePath, features, `Array.${method} method`);
            }
        });
        // String methods  
        const stringMethods = [
            'startsWith', 'endsWith', 'includes', 'repeat', 'padStart', 'padEnd',
            'trim', 'trimStart', 'trimEnd', 'replaceAll'
        ];
        stringMethods.forEach(method => {
            const pattern = new RegExp(`\\.${method}\\s*\\(`);
            if (pattern.test(line)) {
                this.addFeature(`string-${method}`, line, lineNumber, filePath, features, `String.${method} method`);
            }
        });
        // Object methods
        const objectMethods = [
            'assign', 'keys', 'values', 'entries', 'fromEntries',
            'getOwnPropertyDescriptors', 'hasOwn'
        ];
        objectMethods.forEach(method => {
            const pattern = new RegExp(`Object\\.${method}\\s*\\(`);
            if (pattern.test(line)) {
                this.addFeature(`object-${method}`, line, lineNumber, filePath, features, `Object.${method} method`);
            }
        });
        // Check syntax patterns
        syntaxPatterns.forEach(({ pattern, feature, description }) => {
            if (pattern.test(line)) {
                this.addFeature(feature, line, lineNumber, filePath, features, description);
            }
        });
        // Check API patterns
        apiPatterns.forEach(({ pattern, feature, description }) => {
            if (pattern.test(line)) {
                this.addFeature(feature, line, lineNumber, filePath, features, description);
            }
        });
    }
    addFeature(featureId, context, lineNumber, filePath, features, description) {
        const result = this.baselineChecker.checkFeature(featureId);
        if (result.baseline !== null) {
            const severity = this.determineSeverity(result.baseline, result.meetsCriteria);
            features.push({
                feature: featureId,
                featureId: featureId,
                file: filePath,
                line: lineNumber,
                column: 0,
                context: context.trim().slice(0, 100),
                baseline: result.baseline,
                browsers: result.browsers,
                severity,
                suggestion: result.suggestion,
                polyfill: this.getPolyfillSuggestion(featureId),
                alternative: this.getAlternativeSuggestion(featureId)
            });
        }
    }
    determineSeverity(baseline, meetsCriteria) {
        if (!meetsCriteria) {
            return baseline === 'limited' ? 'error' : 'warning';
        }
        return 'info';
    }
    getPolyfillSuggestion(featureId) {
        const polyfills = {
            'fetch': 'whatwg-fetch polyfill',
            'promises': 'es6-promise polyfill',
            'array-includes': 'core-js polyfill',
            'object-assign': 'object-assign polyfill',
            'symbol': 'es6-symbol polyfill',
            'map': 'es6-map polyfill',
            'set': 'es6-set polyfill',
            'intersectionobserver': 'intersection-observer polyfill',
            'resizeobserver': 'resize-observer-polyfill',
            'web-audio-api': 'web-audio-api polyfill'
        };
        return polyfills[featureId];
    }
    getAlternativeSuggestion(featureId) {
        const alternatives = {
            'fetch': 'Use XMLHttpRequest or axios library',
            'promises': 'Use callback patterns or async libraries',
            'arrow-functions': 'Use regular function expressions',
            'template-literals': 'Use string concatenation',
            'optional-chaining': 'Use manual null checking',
            'nullish-coalescing': 'Use || operator with careful null checks'
        };
        return alternatives[featureId];
    }
}
exports.SimpleJavaScriptAnalyzer = SimpleJavaScriptAnalyzer;
//# sourceMappingURL=SimpleJavaScriptAnalyzer.js.map