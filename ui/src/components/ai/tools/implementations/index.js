/**
 * Tools Implementations - Export all available tools
 */

import { WeatherTool } from './WeatherTool.js';
import { CalculatorTool } from './CalculatorTool.js';
import { SearchTool } from './SearchTool.js';
import { CodeAnalyzerTool } from './CodeAnalyzerTool.js';
import { FileOperationsTool } from './FileOperationsTool.js';

export { WeatherTool, CalculatorTool, SearchTool, CodeAnalyzerTool, FileOperationsTool };

// Tool initialization helper
export const initializeDefaultTools = (registry) => {
  const tools = [
    new WeatherTool(),
    new CalculatorTool(),
    new SearchTool(),
    new CodeAnalyzerTool(),
    new FileOperationsTool(),
  ];

  tools.forEach(tool => {
    registry.register(tool);
  });

  return tools;
};
