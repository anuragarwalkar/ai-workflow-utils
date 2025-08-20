import { useEffect, useState } from 'react';
import { loadProjectConfig, saveProjectConfig } from '../utils/storage';

/**
 * Custom hook for managing form data with localStorage persistence
 * @returns {object} Form state and handlers
 */
export const useFormData = () => {
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
  });

  // Load saved values from localStorage on mount
  useEffect(() => {
    const savedConfig = loadProjectConfig();
    if (savedConfig) {
      setFormData({
        projectKey: savedConfig.projectKey || '',
        repoSlug: savedConfig.repoSlug || '',
      });
    }
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const saveFormData = () => {
    saveProjectConfig(formData);
  };

  return {
    formData,
    handleInputChange,
    saveFormData,
  };
};
