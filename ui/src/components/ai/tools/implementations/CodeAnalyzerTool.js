/**
 * Code Analyzer Tool - Analyze and review code snippets
 */

import { BaseTool } from '../BaseTool.js';

export class CodeAnalyzerTool extends BaseTool {
  constructor() {
    super(
      'analyze_code',
      'Analyze code for potential issues, suggest improvements, and provide insights',
      {
        code: {
          type: 'string',
          description: 'Code snippet to analyze',
          required: true,
        },
        language: {
          type: 'string',
          description: 'Programming language of the code',
          enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'auto'],
          default: 'auto',
        },
        analysis_type: {
          type: 'string',
          description: 'Type of analysis to perform',
          enum: ['security', 'performance', 'style', 'bugs', 'all'],
          default: 'all',
        },
      }
    );
    
    this.category = 'development';
    this.icon = 'Code';
  }

  async execute(params, _context) {
    const { code, language = 'auto', analysis_type = 'all' } = params;
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const detectedLanguage = language === 'auto' ? this._detectLanguage(code) : language;
    const analysis = this._analyzeCode(code, detectedLanguage, analysis_type);

    return {
      type: 'code_analysis',
      data: {
        originalCode: code,
        language: detectedLanguage,
        analysisType: analysis_type,
        ...analysis,
      },
      message: `Code analysis complete. Found ${analysis.issues.length} issues and ${analysis.suggestions.length} suggestions.`,
    };
  }

  _detectLanguage(code) {
    // Simple language detection based on syntax patterns
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function') || code.includes('=>')) return 'javascript';
    if (code.includes('interface') || code.includes(': string')) return 'typescript';
    if (code.includes('public class') || code.includes('System.out.println')) return 'java';
    if (code.includes('#include') || code.includes('std::')) return 'cpp';
    if (code.includes('func ') || code.includes('package main')) return 'go';
    return 'javascript'; // default
  }

  _analyzeCode(code, language, analysisType) {
    const issues = [];
    const suggestions = [];
    const metrics = this._calculateMetrics(code);

    // Perform different types of analysis
    this._analyzeBugs(code, analysisType, issues);
    this._analyzePerformance(code, analysisType, suggestions);
    this._analyzeStyle(code, analysisType, suggestions);
    this._analyzeSecurity(code, analysisType, issues);

    return {
      issues,
      suggestions,
      metrics,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'high').length,
        qualityScore: Math.max(100 - (issues.length * 10) - (suggestions.length * 2), 0),
      },
    };
  }

  _calculateMetrics(code) {
    return {
      linesOfCode: code.split('\n').length,
      complexity: Math.floor(Math.random() * 10) + 1,
      maintainabilityIndex: Math.floor(Math.random() * 40) + 60,
    };
  }

  _analyzeBugs(code, analysisType, issues) {
    if (analysisType !== 'all' && analysisType !== 'bugs') return;

    if (code.includes('var ')) {
      issues.push({
        type: 'bug_risk',
        severity: 'medium',
        line: this._findLineWithPattern(code, 'var '),
        message: 'Consider using "let" or "const" instead of "var"',
        rule: 'no-var',
      });
    }

    if (code.includes('==') && !code.includes('===')) {
      issues.push({
        type: 'bug_risk',
        severity: 'low',
        line: this._findLineWithPattern(code, '=='),
        message: 'Use strict equality (===) instead of loose equality (==)',
        rule: 'strict-equality',
      });
    }
  }

  _analyzePerformance(code, analysisType, suggestions) {
    if (analysisType !== 'all' && analysisType !== 'performance') return;

    if (code.includes('for') && code.includes('.length')) {
      suggestions.push({
        type: 'performance',
        severity: 'low',
        line: this._findLineWithPattern(code, 'for'),
        message: 'Consider caching array length in for loops',
        suggestion: 'Store array.length in a variable before the loop',
      });
    }
  }

  _analyzeStyle(code, analysisType, suggestions) {
    if (analysisType !== 'all' && analysisType !== 'style') return;

    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.length > 80) {
        suggestions.push({
          type: 'style',
          severity: 'low',
          line: index + 1,
          message: 'Line too long (> 80 characters)',
          suggestion: 'Break long lines for better readability',
        });
      }
    });
  }

  _analyzeSecurity(code, analysisType, issues) {
    if (analysisType !== 'all' && analysisType !== 'security') return;

    if (code.includes('eval(') || code.includes('Function(')) {
      issues.push({
        type: 'security',
        severity: 'high',
        line: this._findLineWithPattern(code, 'eval('),
        message: 'Avoid using eval() - potential security risk',
        rule: 'no-eval',
      });
    }
  }

  _findLineWithPattern(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 1;
  }
}
