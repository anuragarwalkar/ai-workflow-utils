import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const jiraApi = createApi({
  reducerPath: 'jiraApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/jira`,
  }),
  tagTypes: ['Jira'],
  endpoints: (builder) => ({
    previewJira: builder.mutation({
      query: ({ prompt, images, issueType }) => ({
        url: '/preview',
        method: 'POST',
        body: { prompt, images, issueType },
      }),
    }),
    previewJiraStreaming: builder.mutation({
      queryFn: async ({ prompt, images, issueType, onChunk, onStatus }, { signal }) => {
        try {
          // Use a more RTK Query-like approach while maintaining streaming capability
          const baseUrl = `${API_BASE_URL}/api/jira`;
          const url = `${baseUrl}/preview`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, images, issueType }),
            signal, // RTK Query provides abort signal for cancellation
          });

          if (!response.ok) {
            return { 
              error: { 
                status: response.status, 
                data: `HTTP error! status: ${response.status}` 
              } 
            };
          }

          // Stream processing - this is why we need native fetch
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let finalResult = null;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'status') {
                      onStatus?.(data.message, data.provider);
                    } else if (data.type === 'chunk') {
                      fullContent += data.content;
                      onChunk?.(data.content, fullContent);
                    } else if (data.type === 'complete') {
                      finalResult = {
                        bugReport: data.bugReport,
                        summary: data.summary,
                        description: data.description,
                        message: data.message,
                        provider: data.provider
                      };
                    } else if (data.type === 'error') {
                      return { 
                        error: { 
                          status: 'STREAMING_ERROR', 
                          data: data.error 
                        } 
                      };
                    }
                  } catch (parseError) {
                    // Ignore parsing errors for malformed chunks
                    console.warn('Failed to parse SSE chunk:', parseError);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          // Return in RTK Query expected format
          return { data: finalResult };
        } catch (error) {
          return { 
            error: { 
              status: 'FETCH_ERROR', 
              data: error.message 
            } 
          };
        }
      },
    }),
    createJira: builder.mutation({
      query: ({ summary, description, issueType, priority, projectType, customFields }) => ({
        url: '/generate',
        method: 'POST',
        body: { summary, description, issueType, priority, projectType, customFields },
      }),
      invalidatesTags: ['Jira'],
    }),
    fetchJira: builder.query({
      query: (jiraId) => `/issue/${jiraId}`,
      providesTags: (result, error, jiraId) => [{ type: 'Jira', id: jiraId }],
      // Use keepUnusedDataFor to cache results and reduce API calls
      keepUnusedDataFor: 60, // Keep data for 60 seconds
    }),
    uploadAttachment: builder.mutation({
      query: ({ formData }) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { issueKey }) => [
        { type: 'Jira', id: issueKey },
      ],
    }),
  }),
});

export const {
  usePreviewJiraMutation,
  usePreviewJiraStreamingMutation,
  useCreateJiraMutation,
  useFetchJiraQuery,
  useLazyFetchJiraQuery,
  useUploadAttachmentMutation,
} = jiraApi;
