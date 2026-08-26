/**
 * Curl command parser utility
 * Parses curl commands and extracts URL, method, headers, and body
 */

export class CurlParser {
  /**
   * Parse a curl command string into request components
   * @param {string} curlCommand - The curl command to parse
   * @returns {Object} Parsed request object
   */
  static parse(curlCommand) {
    if (!curlCommand || typeof curlCommand !== 'string') {
      throw new Error('Invalid curl command');
    }

    const cleanCommand = this.cleanCommand(curlCommand);
    const result = this.initializeResult();

    try {
      this.parseUrlAndParams(cleanCommand, result);
      this.parseMethod(cleanCommand, result);
      this.parseHeaders(cleanCommand, result);
      this.parseBody(cleanCommand, result);
      this.parseUserAgent(cleanCommand, result);
      this.parseAuth(cleanCommand, result);

      return result;
    } catch (error) {
      throw new Error(`Failed to parse curl command: ${error.message}`);
    }
  }

  /**
   * Clean up curl command string
   */
  static cleanCommand(curlCommand) {
    return curlCommand
      .replace(/\\\s*\n/g, ' ') // Handle line continuations
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Initialize result object
   */
  static initializeResult() {
    return {
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: '',
      bodyType: 'json'
    };
  }

  /**
   * Parse URL and query parameters
   */
  static parseUrlAndParams(cleanCommand, result) {
    const urlMatch = this.extractUrl(cleanCommand);
    if (urlMatch) {
      const { url, queryParams } = this.parseUrl(urlMatch);
      result.url = url;
      result.params = queryParams;
    }
  }

  /**
   * Parse HTTP method
   */
  static parseMethod(cleanCommand, result) {
    const methodMatch = cleanCommand.match(/-X\s+([A-Z]+)|--request\s+([A-Z]+)/i);
    if (methodMatch) {
      result.method = (methodMatch[1] || methodMatch[2]).toUpperCase();
    }
  }

  /**
   * Parse headers
   */
  static parseHeaders(cleanCommand, result) {
    result.headers = this.extractHeaders(cleanCommand);
  }

  /**
   * Parse request body
   */
  static parseBody(cleanCommand, result) {
    const bodyData = this.extractBody(cleanCommand);
    if (bodyData) {
      result.body = bodyData.body;
      result.bodyType = bodyData.type;
      
      // Set appropriate content-type if not already set
      if (!result.headers['Content-Type'] && !result.headers['content-type']) {
        if (bodyData.type === 'json') {
          result.headers['Content-Type'] = 'application/json';
        } else if (bodyData.type === 'x-www-form-urlencoded') {
          result.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }
    }
  }

  /**
   * Parse user agent
   */
  static parseUserAgent(cleanCommand, result) {
    const userAgentMatch = cleanCommand.match(/-A\s+["']([^"']+)["']|--user-agent\s+["']([^"']+)["']/);
    if (userAgentMatch) {
      result.headers['User-Agent'] = userAgentMatch[1] || userAgentMatch[2];
    }
  }

  /**
   * Parse authentication
   */
  static parseAuth(cleanCommand, result) {
    const authMatch = cleanCommand.match(/-u\s+["']([^"']+)["']|--user\s+["']([^"']+)["']/);
    if (authMatch) {
      const authValue = authMatch[1] || authMatch[2];
      result.headers['Authorization'] = `Basic ${btoa(authValue)}`;
    }
  }

  /**
   * Extract URL from curl command
   */
  static extractUrl(command) {
    // Try to find URL in quotes first
    const quotedUrlMatch = command.match(/["']([^"']*https?:\/\/[^"']+)["']/);
    if (quotedUrlMatch) {
      return quotedUrlMatch[1];
    }

    // Try to find URL without quotes
    const urlMatch = command.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Try to find relative URL or path
    const pathMatch = command.match(/curl\s+[^-\s]*([^\s]+)/);
    if (pathMatch && !pathMatch[1].startsWith('-')) {
      return pathMatch[1];
    }

    return null;
  }

  /**
   * Parse URL and extract query parameters
   */
  static parseUrl(fullUrl) {
    try {
      const url = new URL(fullUrl);
      const params = {};
      
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        url: `${url.protocol}//${url.host}${url.pathname}`,
        queryParams: params
      };
    } catch {
      // If URL parsing fails, assume it's a relative path
      const [path, queryString] = fullUrl.split('?');
      const params = {};
      
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        });
      }

      return {
        url: path,
        queryParams: params
      };
    }
  }

  /**
   * Extract headers from curl command
   */
  static extractHeaders(command) {
    const headers = {};
    
    // Match -H or --header flags
    const headerRegex = /-H\s+["']([^"']+)["']|--header\s+["']([^"']+)["']/g;
    let match;
    
    while ((match = headerRegex.exec(command)) !== null) {
      const headerValue = match[1] || match[2];
      const [key, ...valueParts] = headerValue.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    }

    return headers;
  }

  /**
   * Extract body data from curl command
   */
  static extractBody(command) {
    // Check for --data, --data-raw, --data-binary, -d flags
    const dataMatch = command.match(/(?:--data|--data-raw|--data-binary|-d)\s+["']([^"']+)["']|(?:--data|--data-raw|--data-binary|-d)\s+([^\s]+)/);
    
    if (dataMatch) {
      const bodyContent = dataMatch[1] || dataMatch[2];
      
      // Try to detect JSON
      if (this.isJSON(bodyContent)) {
        return {
          body: this.formatJSON(bodyContent),
          type: 'json'
        };
      }
      
      // Check if it looks like form data
      if (bodyContent.includes('=') && !bodyContent.includes('{')) {
        return {
          body: bodyContent,
          type: 'x-www-form-urlencoded'
        };
      }
      
      return {
        body: bodyContent,
        type: 'text'
      };
    }

    // Check for --form or -F flags (multipart form data)
    const formMatch = command.match(/(?:--form|-F)\s+["']([^"']+)["']|(?:--form|-F)\s+([^\s]+)/g);
    if (formMatch) {
      const formData = formMatch.map(match => {
        const cleaned = match.replace(/(?:--form|-F)\s+["']?([^"']+)["']?/, '$1');
        return cleaned;
      }).join('\n');
      
      return {
        body: formData,
        type: 'form-data'
      };
    }

    return null;
  }

  /**
   * Check if string is valid JSON
   */
  static isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format JSON string with proper indentation
   */
  static formatJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  }

  /**
   * Generate example curl commands for testing
   */
  static getExamples() {
    return [
      {
        name: 'Simple GET request',
        curl: `curl -X GET "https://api.example.com/users" -H "Accept: application/json"`
      },
      {
        name: 'POST with JSON data',
        curl: `curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`
      },
      {
        name: 'PUT with form data',
        curl: `curl -X PUT "https://api.example.com/users/1" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "name=Jane Doe&email=jane@example.com"`
      },
      {
        name: 'GET with query parameters',
        curl: `curl "https://api.example.com/search?q=javascript&limit=10&offset=0" \\
  -H "User-Agent: MyApp/1.0"`
      },
      {
        name: 'DELETE with authentication',
        curl: `curl -X DELETE "https://api.example.com/users/1" \\
  -u "username:password" \\
  -H "Accept: application/json"`
      }
    ];
  }
}

export default CurlParser;
