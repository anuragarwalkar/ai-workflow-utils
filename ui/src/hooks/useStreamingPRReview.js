import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/environment.js';

/**
 * Custom hook for streaming PR reviews using Server-Sent Events
 */
export const useStreamingPRReview = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [reviewComplete, setReviewComplete] = useState(null);
  const [error, setError] = useState(null);

  const startReview = useCallback(
    async ({ projectKey, repoSlug, pullRequestId, diffData, prDetails }) => {
      setIsStreaming(true);
      setStreamingContent('');
      setReviewComplete(null);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/pr/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectKey,
            repoSlug,
            pullRequestId,
            diffData,
            prDetails,
            streaming: true, // Enable streaming
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'status':
                    // Handle status updates
                    console.log('PR Review Status:', data.message);
                    break;

                  case 'content':
                    // Handle streaming content
                    setStreamingContent(prev => prev + data.data);
                    break;

                  case 'review_complete':
                    // Handle review completion
                    setReviewComplete(data.data);
                    setIsStreaming(false);
                    return data.data; // Return the complete review

                  case 'error':
                    // Handle errors
                    throw new Error(data.message || 'Streaming error occurred');

                  default:
                    console.log('Unknown streaming event:', data);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line, parseError);
              }
            }
          }
        }
      } catch (err) {
        console.error('Streaming PR review error:', err);
        setError(err.message || 'Failed to stream PR review');
        setIsStreaming(false);
        throw err;
      }
    },
    []
  );

  const resetReview = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setReviewComplete(null);
    setError(null);
  }, []);

  return {
    startReview,
    resetReview,
    isStreaming,
    streamingContent,
    reviewComplete,
    error,
  };
};

export default useStreamingPRReview;
