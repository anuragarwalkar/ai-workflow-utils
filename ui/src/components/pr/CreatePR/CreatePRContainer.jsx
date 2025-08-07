import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import PRForm from './PRForm';
import PreviewSection from './PreviewSection';
import { useCreatePullRequestMutation } from '../../../store/api/prApi';
import { API_BASE_URL } from '../../../config/environment';

const STORAGE_KEY = 'gitstash_project_config';

const CreatePRContainer = () => {
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
    branchName: '',
  });
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [createPR, { isLoading }] = useCreatePullRequestMutation();

  // Load saved project key and repo slug from local storage
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      const { projectKey, repoSlug } = JSON.parse(savedConfig);
      setFormData(prev => ({
        ...prev,
        projectKey,
        repoSlug,
      }));
    }
  }, []);

  const handleFormChange = newData => {
    setFormData(newData);
    setShowPreview(false);
  };

  const handlePreview = async () => {
    try {
      // Set loading state
      setIsPreviewLoading(true);

      // Reset preview state
      setPreview(null);
      setShowPreview(true);

      // Use fetch with streaming for POST request
      const response = await fetch(`${API_BASE_URL}/api/pr/stream-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let streamedPreview = {
        prTitle: '',
        prDescription: '',
        aiGenerated: false,
        branchName: formData.branchName,
      };

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                if (jsonStr.trim()) {
                  const data = JSON.parse(jsonStr);

                  switch (data.type) {
                    case 'status':
                      break;
                    case 'chunk':
                      // Real-time content streaming - show progress (standardized across app)
                      break;
                    case 'title_chunk':
                      streamedPreview.prTitle += data.data;
                      setPreview({ ...streamedPreview });
                      break;
                    case 'title_complete':
                      streamedPreview.prTitle = data.data;
                      setPreview({ ...streamedPreview });
                      break;
                    case 'description_chunk':
                      streamedPreview.prDescription += data.data;
                      setPreview({ ...streamedPreview });
                      break;
                    case 'description_complete':
                      streamedPreview.prDescription = data.data;
                      setPreview({ ...streamedPreview });
                      break;
                    case 'complete':
                      streamedPreview = data.data;
                      setPreview(streamedPreview);

                      // Save project key and repo slug to local storage after successful preview
                      localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify({
                          projectKey: formData.projectKey,
                          repoSlug: formData.repoSlug,
                        })
                      );
                      setIsPreviewLoading(false);
                      return; // Exit the loop
                    case 'error':
                      console.error('Streaming error:', data.message);
                      setIsPreviewLoading(false);
                      throw new Error(data.message);
                    default:
                      console.log('Unknown stream event:', data.type);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsPreviewLoading(false);
      }
    } catch (error) {
      console.error('Failed to start streaming preview:', error);
      setIsPreviewLoading(false);
      // Fallback to regular API call
      handlePreviewFallback();
    }
  };

  const handlePreviewFallback = async () => {
    try {
      setIsPreviewLoading(true);

      const response = await createPR({
        ...formData,
      }).unwrap();

      // Save project key and repo slug to local storage after successful preview
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projectKey: formData.projectKey,
          repoSlug: formData.repoSlug,
        })
      );

      setPreview(response);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      // Handle error (show notification, etc.)
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCreate = async editedPreview => {
    try {
      await createPR({
        branchName: formData.branchName,
        projectKey: formData.projectKey,
        repoSlug: formData.repoSlug,
        customTitle: editedPreview.prTitle,
        customDescription: editedPreview.prDescription,
      }).unwrap();

      // Handle success (show notification, reset form, etc.)
      setFormData(prev => ({
        ...prev,
        branchName: '',
      }));
      setShowPreview(false);
      setPreview(null);
    } catch (error) {
      console.error('Failed to create PR:', error);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom>
          Create Pull Request
        </Typography>

        <PRForm formData={formData} onChange={handleFormChange} />

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant='contained'
            onClick={handlePreview}
            disabled={
              isPreviewLoading ||
              isLoading ||
              !formData.projectKey ||
              !formData.repoSlug ||
              !formData.branchName
            }
          >
            {isPreviewLoading ? <CircularProgress size={24} /> : 'Preview'}
          </Button>
        </Box>

        {showPreview && preview && (
          <PreviewSection
            preview={preview}
            onConfirm={handleCreate}
            isLoading={isLoading}
          />
        )}
      </Paper>
    </Box>
  );
};

export default CreatePRContainer;
