import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Get __dirname equivalent for ES modules in a cross-platform way
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  try {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
  } catch (error) {
    // Fallback for webpack bundled environment
    return __dirname;
  }
}

/**
 * Get __filename equivalent for ES modules in a cross-platform way
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} File path
 */
export function getFilename(importMetaUrl) {
  try {
    return fileURLToPath(importMetaUrl);
  } catch (error) {
    // Fallback for webpack bundled environment
    return __filename;
  }
}
