/**
 * Calculator Tool - Perform mathematical calculations
 */

import { BaseTool } from '../BaseTool.js';

export class CalculatorTool extends BaseTool {
  constructor() {
    super(
      'calculate',
      'Perform mathematical calculations and evaluate expressions',
      {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4", "sqrt(16)", "sin(30)")',
          required: true,
        },
        precision: {
          type: 'number',
          description: 'Number of decimal places for the result',
          default: 6,
        },
      }
    );
    
    this.category = 'utility';
    this.icon = 'Calculate';
  }

  async execute(params, _context) {
    const { expression, precision = 6 } = params;
    
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simple expression evaluation (in real implementation, use math.js or similar)
      const result = this._evaluateExpression(expression);
      const roundedResult = Number(result.toFixed(precision));

      return {
        type: 'calculation_result',
        data: {
          expression,
          result: roundedResult,
          precision,
          formatted: this._formatResult(roundedResult),
        },
        message: `${expression} = ${roundedResult}`,
      };
    } catch (error) {
      throw new Error(`Calculation error: ${error.message}`);
    }
  }

  _evaluateExpression(expression) {
    // Simple math expression evaluator (placeholder)
    // In real implementation, use a proper math parser like math.js
    const sanitized = expression
      .replace(/\s+/g, '')
      .replace(/[^0-9+\-*/().]/g, '');
    
    // Basic operations
    if (sanitized.includes('sqrt(')) {
      const match = sanitized.match(/sqrt\(([0-9.]+)\)/);
      if (match) {
        return Math.sqrt(parseFloat(match[1]));
      }
    }
    
    if (sanitized.includes('sin(')) {
      const match = sanitized.match(/sin\(([0-9.]+)\)/);
      if (match) {
        return Math.sin(parseFloat(match[1]) * Math.PI / 180);
      }
    }
    
    if (sanitized.includes('cos(')) {
      const match = sanitized.match(/cos\(([0-9.]+)\)/);
      if (match) {
        return Math.cos(parseFloat(match[1]) * Math.PI / 180);
      }
    }
    
    // Basic arithmetic (using Function constructor for demo - don't use in production!)
    return Function(`"use strict"; return (${sanitized})`)();
  }

  _formatResult(result) {
    if (result >= 1000000) {
      return `${(result / 1000000).toFixed(2)}M`;
    }
    if (result >= 1000) {
      return `${(result / 1000).toFixed(2)}K`;
    }
    return result.toString();
  }
}
