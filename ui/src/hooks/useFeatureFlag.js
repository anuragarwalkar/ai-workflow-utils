import { useState, useEffect } from 'react';

/**
 * Custom hook to manage feature flags stored in localStorage
 * @param {string} flagName - The name of the feature flag
 * @param {boolean} defaultValue - Default value if flag doesn't exist
 * @returns {[boolean, function]} - [flagValue, toggleFlag]
 */
export const useFeatureFlag = (flagName, defaultValue = false) => {
  const [flagValue, setFlagValue] = useState(() => {
    const stored = localStorage.getItem(flagName);
    return stored !== null ? stored === 'true' : defaultValue;
  });

  const toggleFlag = (newValue) => {
    const valueToSet = newValue !== undefined ? newValue : !flagValue;
    localStorage.setItem(flagName, valueToSet.toString());
    setFlagValue(valueToSet);
  };

  // Listen for storage changes (useful for multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === flagName) {
        setFlagValue(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagName]);

  return [flagValue, toggleFlag];
};

/**
 * Hook specifically for unreleased features
 */
export const useUnreleasedFeatures = () => {
  return useFeatureFlag('showUnreleasedFeatures', true);
};

/**
 * Hook for send email feature
 */
export const useSendEmailFeature = () => {
  return useFeatureFlag('enableSendEmail', false);
};

/**
 * Hook for release build feature
 */
export const useReleaseBuildFeature = () => {
  return useFeatureFlag('enableReleaseBuild', false);
};

/**
 * Feature flag configuration
 */
export const FEATURE_FLAGS = {
  SHOW_UNRELEASED_FEATURES: 'showUnreleasedFeatures',
  ENABLE_AI_CHAT: 'enableAiChat',
  ENABLE_AUTOMATED_TESTING: 'enableAutomatedTesting',
  ENABLE_CODE_ANALYSIS: 'enableCodeAnalysis',
  ENABLE_WORKFLOW_AUTOMATION: 'enableWorkflowAutomation',
  ENABLE_SEND_EMAIL: 'enableSendEmail',
  ENABLE_RELEASE_BUILD: 'enableReleaseBuild'
};

/**
 * Utility function to check if a feature is enabled
 * @param {string} flagName - Feature flag name
 * @param {boolean} defaultValue - Default value
 * @returns {boolean}
 */
export const isFeatureEnabled = (flagName, defaultValue = false) => {
  const stored = localStorage.getItem(flagName);
  return stored !== null ? stored === 'true' : defaultValue;
};

/**
 * Utility function to enable/disable a feature
 * @param {string} flagName - Feature flag name
 * @param {boolean} enabled - Whether to enable the feature
 */
export const setFeatureFlag = (flagName, enabled) => {
  localStorage.setItem(flagName, enabled.toString());
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('featureFlagChanged', {
    detail: { flagName, enabled }
  }));
};
