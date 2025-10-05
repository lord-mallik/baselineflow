import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { FeatureUsage, FileAnalysis } from '../types';
import { BaselineChecker } from '../core/BaselineChecker';

/**
 * Analyzes JavaScript/TypeScript files for web feature usage
 */
export class JavaScriptAnalyzer {
  private baselineChecker: BaselineChecker;

  constructor(baselineChecker: BaselineChecker) {
    this.baselineChecker = baselineChecker;
  }

  public async analyze(content: string, filePath: string): Promise<FileAnalysis> {
    const features: FeatureUsage[] = [];
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
    
    try {
      const ast = parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'asyncGenerators',
          'bigInt',
          'classProperties',
          'decorators-legacy',
          'doExpressions',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'nullishCoalescingOperator',
          'numericSeparator',
          'objectRestSpread',
          'optionalCatchBinding',
          'optionalChaining',
          'topLevelAwait',
          ...(isTypeScript ? ['typescript' as const] : []),
          ...(isJSX ? ['jsx' as const] : [])
        ]
      });

      traverse(ast, {
        // ES6+ Syntax Features
        ArrowFunctionExpression: (path) => {
          this.checkFeature('arrow-functions', path.node, features, filePath, 'syntax');
        },
        
        ClassDeclaration: (path) => {
          this.checkFeature('es6-class', path.node, features, filePath, 'syntax');
        },

        TemplateLiteral: (path) => {
          this.checkFeature('template-literals', path.node, features, filePath, 'syntax');
        },

        RestElement: (path) => {
          this.checkFeature('rest-parameters', path.node, features, filePath, 'syntax');
        },

        SpreadElement: (path) => {
          this.checkFeature('spread-syntax', path.node, features, filePath, 'syntax');
        },

        // Async/Await
        AwaitExpression: (path) => {
          this.checkFeature('async-await', path.node, features, filePath, 'syntax');
        },
        
        Function: (path) => {
          if ((path.node as any).async) {
            this.checkFeature('async-functions', path.node, features, filePath, 'syntax');
          }
        },

        // Modern operators
        BinaryExpression: (path) => {
          if (path.node.operator === '**') {
            this.checkFeature('exponentiation-operator', path.node, features, filePath, 'operator');
          }
        },

        LogicalExpression: (path) => {
          if (path.node.operator === '??') {
            this.checkFeature('nullish-coalescing', path.node, features, filePath, 'operator');
          }
        },

        OptionalMemberExpression: (path) => {
          this.checkFeature('optional-chaining', path.node, features, filePath, 'syntax');
        },

        // Web APIs and Browser Features
        MemberExpression: (path) => {
          this.analyzeMemberExpression(path, features, filePath);
        },

        CallExpression: (path) => {
          this.analyzeCallExpression(path, features, filePath);
        },

        NewExpression: (path) => {
          this.analyzeNewExpression(path, features, filePath);
        },

        // Import/Export
        ImportDeclaration: (path) => {
          this.checkFeature('es6-modules', path.node, features, filePath, 'syntax');
        },

        ExportDeclaration: (path) => {
          this.checkFeature('es6-modules', path.node, features, filePath, 'syntax');
        },

        // Destructuring
        ObjectPattern: (path) => {
          this.checkFeature('destructuring-assignment', path.node, features, filePath, 'syntax');
        },

        ArrayPattern: (path) => {
          this.checkFeature('destructuring-assignment', path.node, features, filePath, 'syntax');
        }
      });

    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${filePath}:`, error);
    }

    return {
      file: filePath,
      type: isTypeScript ? 'typescript' : 'javascript',
      features
    };
  }

  private analyzeMemberExpression(path: NodePath<t.MemberExpression>, features: FeatureUsage[], filePath: string): void {
    const { object, property } = path.node;
    
    // Web APIs
    if (t.isIdentifier(object)) {
      const objectName = object.name;
      
      // Browser APIs
      const webApis = {
        'navigator': ['serviceWorker', 'geolocation', 'mediaDevices', 'share', 'clipboard'],
        'document': ['querySelector', 'querySelectorAll', 'getElementById'],
        'window': ['fetch', 'requestAnimationFrame', 'IntersectionObserver', 'ResizeObserver'],
        'console': ['log', 'error', 'warn', 'info'],
        'localStorage': ['getItem', 'setItem', 'removeItem'],
        'sessionStorage': ['getItem', 'setItem', 'removeItem']
      };

      if (webApis[objectName as keyof typeof webApis] && t.isIdentifier(property)) {
        const apiName = `${objectName}.${property.name}`;
        this.checkFeature(this.mapApiToFeature(apiName), path.node, features, filePath, 'api');
      }
    }

    // Check for specific web platform features
    if (t.isIdentifier(object) && t.isIdentifier(property)) {
      const memberAccess = `${object.name}.${property.name}`;
      
      const featureMap = {
        'performance.now': 'high-resolution-time',
        'crypto.getRandomValues': 'web-crypto-api',
        'URL.createObjectURL': 'url-api',
        'FormData.append': 'formdata',
        'Blob.arrayBuffer': 'blob',
        'Request.signal': 'abort-controller'
      };

      if (featureMap[memberAccess as keyof typeof featureMap]) {
        this.checkFeature(featureMap[memberAccess as keyof typeof featureMap], path.node, features, filePath, 'api');
      }
    }
  }

  private analyzeCallExpression(path: NodePath<t.CallExpression>, features: FeatureUsage[], filePath: string): void {
    const { callee } = path.node;

    // Global functions
    if (t.isIdentifier(callee)) {
      const functionName = callee.name;
      
      const globalFeatures = {
        'fetch': 'fetch',
        'Promise': 'promises',
        'requestAnimationFrame': 'requestanimationframe',
        'setTimeout': 'settimeout',
        'setInterval': 'setinterval'
      };

      if (globalFeatures[functionName as keyof typeof globalFeatures]) {
        this.checkFeature(globalFeatures[functionName as keyof typeof globalFeatures], path.node, features, filePath, 'api');
      }
    }

    // Method calls
    if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
      const methodName = callee.property.name;
      
      // Array methods
      const arrayMethods = [
        'find', 'findIndex', 'includes', 'entries', 'keys', 'values',
        'map', 'filter', 'reduce', 'forEach', 'some', 'every',
        'flat', 'flatMap', 'from', 'of'
      ];

      if (arrayMethods.includes(methodName)) {
        this.checkFeature(`array-${methodName}`, path.node, features, filePath, 'method');
      }

      // String methods
      const stringMethods = [
        'startsWith', 'endsWith', 'includes', 'repeat', 'padStart', 'padEnd',
        'trim', 'trimStart', 'trimEnd', 'replaceAll'
      ];

      if (stringMethods.includes(methodName)) {
        this.checkFeature(`string-${methodName}`, path.node, features, filePath, 'method');
      }

      // Object methods
      if (t.isIdentifier(callee.object) && callee.object.name === 'Object') {
        const objectMethods = [
          'assign', 'keys', 'values', 'entries', 'fromEntries',
          'getOwnPropertyDescriptors', 'hasOwn'
        ];

        if (objectMethods.includes(methodName)) {
          this.checkFeature(`object-${methodName}`, path.node, features, filePath, 'method');
        }
      }
    }
  }

  private analyzeNewExpression(path: NodePath<t.NewExpression>, features: FeatureUsage[], filePath: string): void {
    const { callee } = path.node;

    if (t.isIdentifier(callee)) {
      const constructorName = callee.name;
      
      const constructorFeatures = {
        'Promise': 'promises',
        'Map': 'map',
        'Set': 'set',
        'WeakMap': 'weakmap',
        'WeakSet': 'weakset',
        'Symbol': 'symbol',
        'Proxy': 'proxy',
        'IntersectionObserver': 'intersectionobserver',
        'ResizeObserver': 'resizeobserver',
        'MutationObserver': 'mutationobserver',
        'AbortController': 'abortcontroller',
        'URL': 'url',
        'URLSearchParams': 'url-api',
        'FormData': 'formdata',
        'Blob': 'blob',
        'File': 'file-api',
        'FileReader': 'filereader',
        'Worker': 'web-workers',
        'ServiceWorker': 'serviceworker',
        'WebSocket': 'websockets',
        'EventSource': 'eventsource',
        'XMLHttpRequest': 'xhr',
        'MediaRecorder': 'mediastream-recording',
        'AudioContext': 'web-audio-api',
        'OffscreenCanvas': 'offscreencanvas'
      };

      if (constructorFeatures[constructorName as keyof typeof constructorFeatures]) {
        this.checkFeature(constructorFeatures[constructorName as keyof typeof constructorFeatures], path.node, features, filePath, 'constructor');
      }
    }
  }

  private mapApiToFeature(api: string): string {
    const apiMap = {
      'navigator.serviceWorker': 'serviceworker',
      'navigator.geolocation': 'geolocation',
      'navigator.mediaDevices': 'getusermedia',
      'navigator.share': 'web-share',
      'navigator.clipboard': 'clipboard-api',
      'window.fetch': 'fetch',
      'window.requestAnimationFrame': 'requestanimationframe',
      'window.IntersectionObserver': 'intersectionobserver',
      'window.ResizeObserver': 'resizeobserver',
      'localStorage.getItem': 'webstorage',
      'sessionStorage.getItem': 'webstorage'
    };

    return apiMap[api as keyof typeof apiMap] || api.toLowerCase().replace('.', '-');
  }

  private checkFeature(
    featureId: string,
    node: t.Node,
    features: FeatureUsage[],
    filePath: string,
    type: string
  ): void {
    const result = this.baselineChecker.checkFeature(featureId);
    
    if (result.baseline !== null) {
      const severity = this.determineSeverity(result.baseline, result.meetsCriteria);
      
      features.push({
        feature: featureId,
        featureId: featureId,
        file: filePath,
        line: node.loc?.start.line || 0,
        column: node.loc?.start.column || 0,
        context: this.getContext(node, type),
        baseline: result.baseline,
        browsers: result.browsers,
        severity,
        suggestion: result.suggestion,
        polyfill: this.getPolyfillSuggestion(featureId),
        alternative: this.getAlternativeSuggestion(featureId)
      });
    }
  }

  private determineSeverity(
    baseline: string,
    meetsCriteria: boolean
  ): 'error' | 'warning' | 'info' {
    if (!meetsCriteria) {
      return baseline === 'limited' ? 'error' : 'warning';
    }
    return 'info';
  }

  private getContext(node: t.Node, type: string): string {
    // Generate meaningful context based on node type
    if (t.isMemberExpression(node)) {
      return `${t.isIdentifier(node.object) ? node.object.name : 'object'}.${
        t.isIdentifier(node.property) ? node.property.name : 'property'
      }`;
    }
    
    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
      return `${node.callee.name}()`;
    }

    if (t.isNewExpression(node) && t.isIdentifier(node.callee)) {
      return `new ${node.callee.name}()`;
    }

    return type;
  }

  private getPolyfillSuggestion(featureId: string): string | undefined {
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
    
    return polyfills[featureId as keyof typeof polyfills];
  }

  private getAlternativeSuggestion(featureId: string): string | undefined {
    const alternatives = {
      'fetch': 'Use XMLHttpRequest or axios library',
      'promises': 'Use callback patterns or async libraries',
      'arrow-functions': 'Use regular function expressions',
      'template-literals': 'Use string concatenation',
      'destructuring-assignment': 'Use manual assignment',
      'optional-chaining': 'Use manual null checking',
      'nullish-coalescing': 'Use || operator with careful null checks'
    };
    
    return alternatives[featureId as keyof typeof alternatives];
  }
}