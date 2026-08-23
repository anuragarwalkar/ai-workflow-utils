/**
 * Global Error and Unhandled Rejection Handlers for PWA Resilience
 * Captures Vite chunk load errors and runtime promise rejections gracefully.
 */

import { isChunkLoadError } from './lazyWithRetry.js';
import { createLogger } from './log.js';

const logger = createLogger('GlobalErrorHandler');

const GLOBAL_RELOAD_KEY = 'pwa_global_chunk_reload';
const COOLDOWN_MS = 20000; // 20s cooldown

let isInitialized = false;

/**
 * Handle a detected chunk load error globally
 * @param {string} source - Source of the error ('vite:preloadError' | 'unhandledrejection' | 'error')
 * @param {Error|any} error - The error object
 * @returns {boolean} True if reload was initiated
 */
const handleGlobalChunkError = (source, error) => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }

  const lastReload = sessionStorage.getItem(GLOBAL_RELOAD_KEY);
  const now = Date.now();

  logger.error('handleGlobalChunkError', `Chunk loading failure detected from [${source}]`, error);

  if (!lastReload || now - parseInt(lastReload, 10) > COOLDOWN_MS) {
    sessionStorage.setItem(GLOBAL_RELOAD_KEY, String(now));
    logger.info('handleGlobalChunkError', 'Performing single auto-reload to fetch fresh application bundle');

    // Trigger service worker update if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update());
      }).catch(() => {});
    }

    window.location.reload();
    return true;
  }

  return false;
};

/**
 * Initialize global error handlers
 */
export const initGlobalErrorHandlers = () => {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;

  // 1. Listen for Vite dynamic import preload errors
  window.addEventListener('vite:preloadError', (event) => {
    logger.error('vite:preloadError', 'Vite preload error event received', event);
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault(); // Prevent Vite default unhandled throw
    }
    handleGlobalChunkError('vite:preloadError', event?.payload || event);
  });

  // 2. Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const { reason } = event;
    if (isChunkLoadError(reason)) {
      logger.error('unhandledrejection', 'Caught dynamic import chunk rejection:', reason?.message);
      if (typeof event.preventDefault === 'function') {
        event.preventDefault(); // Prevent browser console uncaught noise
      }
      handleGlobalChunkError('unhandledrejection', reason);
    } else {
      logger.error('unhandledrejection', 'Unhandled promise rejection in application:', reason);
    }
  });

  // 3. Listen for window errors (e.g. script loading 404s)
  window.addEventListener('error', (event) => {
    const { error, message, target } = event;
    const errorOrMsg = error || message;
    if (isChunkLoadError(errorOrMsg) || (target && target.tagName === 'SCRIPT')) {
      logger.error('window.error', 'Script/Chunk loading error event:', errorOrMsg);
      handleGlobalChunkError('error', errorOrMsg);
    }
  });

  logger.info('initGlobalErrorHandlers', 'Global PWA error handlers initialized');
};

export default initGlobalErrorHandlers;
