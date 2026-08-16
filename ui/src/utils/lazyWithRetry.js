/**
 * Resilient Lazy Loading with Automatic Retry and Chunk Load Error Recovery
 * Prevents PWA and Single Page Application crashes caused by missing/updated hashed assets.
 */

import { lazy } from 'react';
import { createLogger } from './log.js';

const logger = createLogger('lazyWithRetry');

const RELOAD_KEY_PREFIX = 'pwa_chunk_reload_';
const RELOAD_COOLDOWN_MS = 20000; // 20 seconds cooldown to prevent reload loops

/**
 * Detect if an error is a dynamic import or chunk loading failure
 * @param {Error|any} error
 * @returns {boolean}
 */
export const isChunkLoadError = (error) => {
  if (!error) return false;
  const message = String(error.message || error.toString() || '').toLowerCase();
  const name = String(error.name || '').toLowerCase();

  return (
    name.includes('chunkloaderror') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    message.includes('failed to load resource') ||
    message.includes('networkerror when attempting to fetch resource')
  );
};

/**
 * Clear all PWA caches, unregister service workers, and hard reload the application
 */
export const clearAppCacheAndReload = async () => {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(RELOAD_KEY_PREFIX) || key.includes('chunk') || key.includes('preload')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (err) {
    logger.error('clearAppCacheAndReload', 'Failed to fully clear caches before reload', err);
  } finally {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
};

/**
 * Trigger auto reload on chunk failure if cooldown allows
 * @param {string} key
 * @returns {boolean}
 */
const tryAutoReload = (key) => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }

  const reloadKey = `${RELOAD_KEY_PREFIX}${key || window.location.pathname}`;
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();

  if (lastReload && now - parseInt(lastReload, 10) <= RELOAD_COOLDOWN_MS) {
    return false;
  }

  logger.info('tryAutoReload', `Chunk 404 detected. Triggering single auto-reload for ${reloadKey}`);
  sessionStorage.setItem(reloadKey, String(now));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.update());
    }).catch(() => {});
  }

  window.location.reload();
  return true;
};

/**
 * Wrap a dynamic import with auto-retry and single auto-reload recovery
 * @param {Function} factory - Dynamic import function, e.g. () => import('./MyComponent')
 * @param {Object} options - Configuration options
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @param {number} options.interval - Base interval between retries in ms (default: 400)
 * @param {string} options.key - Unique key for component to avoid reload collisions
 * @returns {Promise<any>}
 */
export const retryImport = async (factory, { retries = 2, interval = 400, key = '' } = {}) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const module = await factory();
      if (typeof sessionStorage !== 'undefined' && key) {
        sessionStorage.removeItem(`${RELOAD_KEY_PREFIX}${key}`);
      }
      return module;
    } catch (error) {
      logger.error('retryImport', `Import failed (attempt ${attempt + 1}/${retries + 1}): ${error?.message}`);

      if (attempt < retries) {
        const delay = interval * Math.pow(1.5, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (isChunkLoadError(error) && tryAutoReload(key)) {
        return new Promise(() => {});
      } else {
        throw error;
      }
    }
  }
};

/**
 * Enhanced lazy loader with retry, auto-reload recovery, and safe preloading
 * @param {Function} factory - Dynamic import function, e.g. () => import('./MyComponent')
 * @param {string} [name] - Optional component name for tracking
 * @returns {React.LazyExoticComponent} Component with attached .preload() method
 */
export const lazyWithPreload = (factory, name = '') => {
  let preloadPromise = null;

  const safeFactory = () => retryImport(factory, { key: name });
  const Component = lazy(safeFactory);

  Component.preload = () => {
    if (!preloadPromise) {
      preloadPromise = safeFactory().catch((err) => {
        logger.info('preload', `Background preloading of ${name || 'chunk'} failed gracefully: ${err?.message}`);
        preloadPromise = null;
        return null;
      });
    }
    return preloadPromise;
  };

  return Component;
};

export default lazyWithPreload;
