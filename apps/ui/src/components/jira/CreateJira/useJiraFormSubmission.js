import {
  setPreviewData,
  setStreaming,
  setStreamingContent,
  setStreamingStatus,
} from '../../../store/slices/jiraSlice';
import { showNotification } from '../../../store/slices/uiSlice';
import { saveToLocalStorage } from './utils';

export const useJiraFormSubmission = ({
  dispatch,
  previewJiraStreaming,
  prompt,
  imageFile,
  issueType,
  projectType,
  customFields,
}) => {
  const handleStreamingRequest = async images => {
    try {
      const result = await previewJiraStreaming({
        prompt,
        images,
        issueType,
        onChunk: (_chunk, fullContent) => {
          dispatch(setStreamingContent(fullContent));
        },
        onStatus: (status, provider) => {
          dispatch(setStreamingStatus(`${status} (${provider})`));
        },
      }).unwrap();

      dispatch(setStreaming(false));
      dispatch(setPreviewData(result));
      dispatch(
        showNotification({
          message: 'Preview generated successfully!',
          severity: 'success',
        })
      );
    } catch (error) {
      dispatch(setStreaming(false));
      dispatch(
        showNotification({
          message: `Error: ${error.error || error.message}`,
          severity: 'error',
        })
      );
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();

    saveToLocalStorage(projectType, issueType, customFields);

    const url = new URL(window.location.href);
    url.searchParams.set('prompt', encodeURIComponent(prompt));
    window.history.replaceState({}, '', url);

    dispatch(setStreamingContent(''));
    dispatch(setStreamingStatus(''));
    dispatch(setStreaming(true));

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        const [, base64Image] = reader.result.split(',');
        await handleStreamingRequest([base64Image]);
      };

      reader.onerror = () => {
        dispatch(setStreaming(false));
        dispatch(
          showNotification({
            message: 'Failed to read the file. Please try again.',
            severity: 'error',
          })
        );
      };

      reader.readAsDataURL(imageFile);
    } else {
      await handleStreamingRequest([]);
    }
  };

  return { handleSubmit };
};
