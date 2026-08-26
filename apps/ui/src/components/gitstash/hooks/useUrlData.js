import { useState } from 'react';
import { parseGitStashUrl } from '../utils/urlParser';

/**
 * Custom hook for managing URL data and parsing
 * @returns {object} URL state and handlers
 */
export const useUrlData = () => {
  const [urlData, setUrlData] = useState({
    url: '',
    parsedData: null,
    directToPR: false,
  });

  const handleUrlChange = (event) => {
    const url = event.target.value;
    setUrlData(prev => ({ ...prev, url }));

    if (url.trim()) {
      const parsed = parseGitStashUrl(url);
      setUrlData(prev => ({
        ...prev,
        parsedData: parsed,
        // Automatically enable direct PR navigation if PR number is found
        directToPR: parsed.isValid && parsed.prNumber ? true : prev.directToPR,
      }));
    } else {
      setUrlData(prev => ({ ...prev, parsedData: null, directToPR: false }));
    }
  };

  const handleDirectToPRChange = (event) => {
    setUrlData(prev => ({ ...prev, directToPR: event.target.checked }));
  };

  return {
    urlData,
    handleUrlChange,
    handleDirectToPRChange,
  };
};
