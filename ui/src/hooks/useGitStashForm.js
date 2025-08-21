import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setDirectPRId, setError, setSelectedProject } from '../store/slices/prSlice';

const STORAGE_KEY = 'gitstash_project_config';

const parseGitStashUrl = url => {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const urlPattern =
      /\/projects\/([^/]+)\/repos\/([^/]+)(?:\/pull-requests\/(\d+)(?:\/(?:overview|diff|commits))?)?/;
    const match = cleanUrl.match(urlPattern);

    if (match) {
      const [, projectKey, repoSlug, prNumber] = match;
      return {
        projectKey: projectKey.toUpperCase(),
        repoSlug,
        prNumber: prNumber ? parseInt(prNumber, 10) : null,
        isValid: true,
      };
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
};

const loadSavedConfig = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch {
    // Failed to load saved project configuration
  }
  return null;
};

const saveToLocalStorage = data => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Failed to save project configuration
  }
};

export const useGitStashForm = ({ onNext, onDirectNext }) => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
  });
  const [urlData, setUrlData] = useState({
    url: '',
    parsedData: null,
    directToPR: false,
  });

  useEffect(() => {
    const savedConfig = loadSavedConfig();
    if (savedConfig) {
      setFormData({
        projectKey: savedConfig.projectKey || '',
        repoSlug: savedConfig.repoSlug || '',
      });
    }
  }, []);

  const handleInputChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    dispatch(setError(null));
  };

  const handleUrlChange = event => {
    const url = event.target.value;
    setUrlData(prev => ({ ...prev, url }));

    if (url.trim()) {
      const parsed = parseGitStashUrl(url);
      setUrlData(prev => ({
        ...prev,
        parsedData: parsed,
        directToPR: parsed.isValid && parsed.prNumber ? true : prev.directToPR,
      }));

      if (parsed.isValid) {
        dispatch(setError(null));
      }
    } else {
      setUrlData(prev => ({ ...prev, parsedData: null, directToPR: false }));
    }
  };

  const handleDirectToPRChange = event => {
    setUrlData(prev => ({ ...prev, directToPR: event.target.checked }));
  };

  const validateAndParseForm = () => {
    if (tabValue === 0) {
      if (!formData.projectKey.trim() || !formData.repoSlug.trim()) {
        dispatch(setError('Please enter both Project Key and Repository Slug'));
        return null;
      }

      return {
        projectData: {
          projectKey: formData.projectKey.trim(),
          repoSlug: formData.repoSlug.trim(),
        },
        prNumber: null,
      };
    }

    if (!urlData.url.trim()) {
      dispatch(setError('Please enter a GitStash URL'));
      return null;
    }

    const parsed = parseGitStashUrl(urlData.url);
    if (!parsed.isValid) {
      dispatch(setError('Invalid GitStash URL format. Please check the URL and try again.'));
      return null;
    }

    const { projectKey, repoSlug, prNumber } = parsed;
    return {
      projectData: { projectKey, repoSlug },
      prNumber,
    };
  };

  const processSubmission = async ({ projectData, prNumber }) => {
    setIsLoading(true);
    dispatch(setError(null));

    try {
      saveToLocalStorage(projectData);

      if (prNumber && urlData.directToPR) {
        dispatch(setDirectPRId(prNumber));
      }

      dispatch(setSelectedProject(projectData));

      if (prNumber && urlData.directToPR) {
        dispatch(setDirectPRId(prNumber));
        setTimeout(() => {
          onDirectNext();
        }, 50);
      } else {
        onNext();
      }
    } catch {
      dispatch(setError('Failed to set project details'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validatedData = validateAndParseForm();
    if (validatedData) {
      await processSubmission(validatedData);
    }
  };

  return {
    tabValue,
    isLoading,
    formData,
    urlData,
    handleInputChange,
    handleTabChange,
    handleUrlChange,
    handleDirectToPRChange,
    handleSubmit,
  };
};
