import logger from '../../../logger.js';

/**
 * Utility class for filtering files that should be ignored in diff processing
 * to avoid sending unnecessary content to LLM
 */
class FileFilter {
  /**
   * List of file patterns that should be ignored
   */
  static IGNORED_PATTERNS = [
    // Package manager files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'Pipfile.lock',
    'poetry.lock',
    'Gemfile.lock',
    'go.sum',
    'Cargo.lock',

    // Build and distribution files
    'dist/',
    'build/',
    'out/',
    'target/',
    '.next/',
    '.nuxt/',
    'coverage/',
    '.nyc_output/',

    // Dependencies and modules
    'node_modules/',
    'vendor/',
    '.venv/',
    'venv/',
    '__pycache__/',
    '.pytest_cache/',

    // IDE and editor files
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '*~',
    '.DS_Store',
    'Thumbs.db',

    // Version control
    '.git/',
    '.svn/',
    '.hg/',

    // Logs and temporary files
    '*.log',
    '*.tmp',
    '*.temp',
    'logs/',
    'tmp/',
    'temp/',

    // Compiled and generated files
    '*.min.js',
    '*.min.css',
    '*.bundle.js',
    '*.bundle.css',
    '*.map',
    '*.d.ts.map',

    // Documentation build outputs
    '_site/',
    'docs/_build/',
    'site/',

    // Environment and config files (often auto-generated)
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',

    // Binary and media files
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
    '*.jar',
    '*.war',
    '*.ear',
    '*.zip',
    '*.tar.gz',
    '*.rar',
    '*.7z',
    '*.pdf',
    '*.doc',
    '*.docx',
    '*.xls',
    '*.xlsx',
    '*.ppt',
    '*.pptx',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.bmp',
    '*.ico',
    '*.svg',
    '*.webp',
    '*.mp3',
    '*.mp4',
    '*.avi',
    '*.mov',
    '*.wmv',
    '*.flv',
    '*.webm',

    // Large data files
    '*.sql',
    '*.db',
    '*.sqlite',
    '*.sqlite3',
    '*.dump',

    // Generated documentation
    'CHANGELOG.md',
    'CHANGELOG.txt',
    'HISTORY.md',
    'HISTORY.txt',
  ];

  /**
   * Additional patterns for specific file extensions that are typically auto-generated
   */
  static IGNORED_EXTENSIONS = [
    '.min.js',
    '.min.css',
    '.bundle.js',
    '.bundle.css',
    '.map',
    '.lock',
    '.log',
    '.tmp',
    '.temp',
    '.cache',
    '.pid',
    '.seed',
    '.pid.lock',
    '.coverage',
  ];

  /**
   * Check if a file should be ignored based on its path
   * @param {string} filePath - The file path to check
   * @returns {boolean} - True if the file should be ignored
   */
  static shouldIgnoreFile(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

    // Check against ignored patterns
    for (const pattern of this.IGNORED_PATTERNS) {
      if (this.matchesPattern(normalizedPath, pattern.toLowerCase())) {
        logger.debug(`FileFilter: Ignoring file ${filePath} (matches pattern: ${pattern})`);
        return true;
      }
    }

    // Check against ignored extensions
    for (const ext of this.IGNORED_EXTENSIONS) {
      if (normalizedPath.endsWith(ext)) {
        logger.debug(`FileFilter: Ignoring file ${filePath} (matches extension: ${ext})`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a path matches a pattern (supports wildcards and directory patterns)
   * @param {string} path - The path to check
   * @param {string} pattern - The pattern to match against
   * @returns {boolean} - True if the path matches the pattern
   */
  static matchesPattern(path, pattern) {
    // Handle directory patterns (ending with /)
    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);
      return path.includes(`/${dirPattern}/`) || path.startsWith(`${dirPattern}/`);
    }

    // Handle wildcard patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path) || path.includes(pattern.replace('*', ''));
    }

    // Handle exact matches and contains
    return path === pattern || path.endsWith(`/${pattern}`) || path.includes(pattern);
  }

  /**
   * Filter an array of file paths, removing ignored files
   * @param {string[]} filePaths - Array of file paths to filter
   * @returns {string[]} - Filtered array with ignored files removed
   */
  static filterFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
      return [];
    }

    const filtered = filePaths.filter(filePath => !this.shouldIgnoreFile(filePath));
    const ignoredCount = filePaths.length - filtered.length;

    if (ignoredCount > 0) {
      logger.info(`FileFilter: Filtered out ${ignoredCount} ignored files from ${filePaths.length} total files`);
    }

    return filtered;
  }

  /**
   * Get statistics about filtered files
   * @param {string[]} filePaths - Array of file paths to analyze
   * @returns {object} - Statistics about filtering
   */
  static getFilterStats(filePaths) {
    if (!Array.isArray(filePaths)) {
      return { total: 0, ignored: 0, included: 0, ignoredFiles: [] };
    }

    const ignoredFiles = filePaths.filter(filePath => this.shouldIgnoreFile(filePath));
    const includedFiles = filePaths.filter(filePath => !this.shouldIgnoreFile(filePath));

    return {
      total: filePaths.length,
      ignored: ignoredFiles.length,
      included: includedFiles.length,
      ignoredFiles,
      includedFiles,
    };
  }

  /**
   * Add custom patterns to the ignore list (for runtime configuration)
   * @param {string[]} patterns - Additional patterns to ignore
   */
  static addIgnorePatterns(patterns) {
    if (Array.isArray(patterns)) {
      this.IGNORED_PATTERNS.push(...patterns);
      logger.info(`FileFilter: Added ${patterns.length} custom ignore patterns`);
    }
  }

  /**
   * Check if a file is likely to be auto-generated based on common patterns
   * @param {string} filePath - The file path to check
   * @returns {boolean} - True if the file appears to be auto-generated
   */
  static isLikelyAutoGenerated(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    const autoGenPatterns = [
      /generated/i,
      /auto-generated/i,
      /\.generated\./i,
      /\.auto\./i,
      /build\//i,
      /dist\//i,
      /out\//i,
      /\.min\./i,
      /\.bundle\./i,
      /\.map$/i,
      /lock$/i,
    ];

    return autoGenPatterns.some(pattern => pattern.test(filePath));
  }
}

export default FileFilter;
