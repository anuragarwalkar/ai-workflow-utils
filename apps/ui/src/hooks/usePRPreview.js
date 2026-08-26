/**
 * Custom hook for managing PR preview state and streaming functionality
 */

import { useState } from 'react';
import { DEFAULT_PREVIEW_STATE, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/pr.js';
import { streamPRPreview } from '../services/prStreamService.js';
import { useCreatePullRequestMutation } from '../store/api/prApi.js';
import { createLogger } from '../utils/log.js';

const logger = createLogger('usePRPreview');

/**
 * Hook for managing PR preview functionality
 * @returns {object} Preview state and handlers
 */
export const usePRPreview = () => {
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [createPR] = useCreatePullRequestMutation();

  /**
   * Generate preview using streaming API
   * @param {object} formData - Form data for preview generation
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  const generatePreview = async (formData, onSuccess, onError) => {
    logger.info('generatePreview', 'Starting preview generation', formData);
    
    try {
      setIsPreviewLoading(true);
      setPreview(null);
      setShowPreview(true);

      const callbacks = {
        onUpdate: (updatedPreview) => {
          logger.debug('generatePreview', 'Preview update received', updatedPreview);
          setPreview(updatedPreview);
        },
        onComplete: (finalPreview) => {
          logger.info('generatePreview', 'Preview generation completed');
          setPreview(finalPreview);
          setIsPreviewLoading(false);
          onSuccess?.(finalPreview);
        },
        onError: (error) => {
          logger.error('generatePreview', 'Preview generation failed', error);
          setIsPreviewLoading(false);
          
          // Try fallback method
          handlePreviewFallback(formData, onSuccess, onError);
        },
      };

      await streamPRPreview({ formData, callbacks });
    } catch (error) {
      logger.error('generatePreview', ERROR_MESSAGES.PREVIEW_FAILED, error);
      setIsPreviewLoading(false);
      handlePreviewFallback(formData, onSuccess, onError);
    }
  };

  /**
   * Fallback preview generation using regular API
   * @param {object} formData - Form data for preview generation
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  const handlePreviewFallback = async (formData, onSuccess, onError) => {
    logger.info('handlePreviewFallback', 'Using fallback preview method');
    
    try {
      setIsPreviewLoading(true);

      const response = await createPR(formData).unwrap();
      
      setPreview(response);
      setShowPreview(true);
      setIsPreviewLoading(false);
      
      logger.info('handlePreviewFallback', SUCCESS_MESSAGES.PREVIEW_GENERATED);
      onSuccess?.(response);
    } catch (error) {
      logger.error('handlePreviewFallback', ERROR_MESSAGES.PREVIEW_FAILED, error);
      setIsPreviewLoading(false);
      onError?.(error);
    }
  };

  /**
   * Reset preview state
   */
  const resetPreview = () => {
    logger.info('resetPreview', 'Resetting preview state');
    setPreview(null);
    setShowPreview(false);
    setIsPreviewLoading(false);
  };

  /**
   * Update preview data
   * @param {object} updatedPreview - Updated preview data
   */
  const updatePreview = (updatedPreview) => {
    logger.debug('updatePreview', 'Updating preview data', updatedPreview);
    setPreview(updatedPreview);
  };

  /**
   * Check if preview is ready for creation
   * @returns {boolean} Whether preview is ready
   */
  const isPreviewReady = () => {
    const isReady = !!(
      preview &&
      preview.prTitle &&
      preview.prDescription
    );
    
    logger.debug('isPreviewReady', `Preview ready: ${isReady}`, preview);
    return isReady;
  };

  return {
    preview,
    showPreview,
    isPreviewLoading,
    generatePreview,
    resetPreview,
    updatePreview,
    isPreviewReady,
  };
};
