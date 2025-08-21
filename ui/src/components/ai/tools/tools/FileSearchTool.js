/**
 * File Search Tool - Searches for files and content within the project
 */

import { BaseTool } from '../BaseTool';
import { createLogger } from '../../../../utils/log';

const logger = createLogger('FileSearchTool');

export class FileSearchTool extends BaseTool {
  constructor() {
    super({
      name: 'file_search',
      description: 'Searches for files by name or content within the project structure',
      category: 'utility',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query (filename or content)',
          required: true,
        },
        search_type: {
          type: 'string',
          description: 'Type of search: filename, content, or both',
          required: false,
          default: 'both',
          enum: ['filename', 'content', 'both'],
        },
        file_types: {
          type: 'array',
          description: 'File extensions to include (e.g., [".js", ".jsx", ".ts"])',
          required: false,
          items: {
            type: 'string',
          },
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          required: false,
          default: 50,
          minimum: 1,
          maximum: 200,
        },
      },
    });
  }

  async execute(params) {
    logger.info('execute', 'Searching files', { 
      query: params.query,
      searchType: params.search_type,
      maxResults: params.max_results,
    });

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock search results
    const mockFiles = [
      'src/components/ui/Button.jsx',
      'src/components/ui/Input.jsx',
      'src/components/layout/Header.jsx',
      'src/components/ai/ChatMessage.jsx',
      'src/components/ai/tools/ToolsRegistry.js',
      'src/utils/helpers.js',
      'src/services/apiService.js',
      'tests/components/Button.test.js',
      'docs/README.md',
      'package.json',
    ];

    const searchResults = mockFiles
      .filter(file => 
        file.toLowerCase().includes(params.query.toLowerCase())
      )
      .slice(0, params.max_results || 50)
      .map(file => ({
        path: file,
        type: 'file',
        size: Math.floor(Math.random() * 10000) + 500,
        lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        matches: params.search_type !== 'filename' ? [
          {
            line: Math.floor(Math.random() * 100) + 1,
            content: `// This line contains: ${params.query}`,
            context: 'Function or component definition',
          },
        ] : [],
      }));

    return {
      success: true,
      query: params.query,
      searchType: params.search_type,
      totalResults: searchResults.length,
      results: searchResults,
      summary: `Found ${searchResults.length} files matching "${params.query}"`,
      searchTime: Math.floor(Math.random() * 500) + 100, // milliseconds
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-instantiate to register the tool
new FileSearchTool();

export default FileSearchTool;
