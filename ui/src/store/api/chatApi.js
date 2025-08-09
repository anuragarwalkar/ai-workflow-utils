import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/chat`,
  }),
  tagTypes: ['Chat'],
  endpoints: builder => ({
    sendChatMessage: builder.mutation({
      query: ({ message, conversationHistory, template = 'CHAT_GENERIC' }) => ({
        url: '/message',
        method: 'POST',
        body: { message, conversationHistory, template },
      }),
    }),
    sendChatMessageStreaming: builder.mutation({
      queryFn: async (
        {
          message,
          conversationHistory,
          template = 'CHAT_GENERIC',
          onChunk,
          onStatus,
        },
        { signal }
      ) => {
        try {
          const baseUrl = `${API_BASE_URL}/api/chat`;
          const url = `${baseUrl}/stream`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, conversationHistory, template }),
            signal,
          });

          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: `HTTP error! status: ${response.status}`,
              },
            };
          }

          // Stream processing
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
                        response: data.response,
                        provider: data.provider,
                      };
                    } else if (data.type === 'error') {
                      return {
                        error: {
                          status: 'STREAMING_ERROR',
                          data: data.error,
                        },
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
              data: error.message,
            },
          };
        }
      },
    }),
  }),
});

export const {
  useSendChatMessageMutation,
  useSendChatMessageStreamingMutation,
} = chatApi;
