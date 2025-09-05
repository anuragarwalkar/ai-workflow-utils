import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

/**
 * Voice API - RTK Query API for voice assistant functionality
 * Handles REST endpoints for voice sessions and configuration
 */
export const voiceApi = createApi({
  reducerPath: 'voiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/voice`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['VoiceSession', 'VoiceConfig'],
  endpoints: (builder) => ({
    // Start a new voice session
    startVoiceSession: builder.mutation({
      query: (sessionData) => ({
        url: '/session/start',
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: ['VoiceSession'],
    }),

    // Stop a voice session
    stopVoiceSession: builder.mutation({
      query: (sessionId) => ({
        url: `/session/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VoiceSession'],
    }),

    // Send text input to voice session
    sendVoiceTextInput: builder.mutation({
      query: ({ sessionId, text }) => ({
        url: `/session/${sessionId}/text`,
        method: 'POST',
        body: { text },
      }),
    }),

    // Send audio input to voice session
    sendVoiceAudioInput: builder.mutation({
      query: ({ sessionId, audioData, mimeType }) => ({
        url: `/session/${sessionId}/audio`,
        method: 'POST',
        body: { audioData, mimeType },
      }),
    }),

    // Get active voice sessions
    getActiveVoiceSessions: builder.query({
      query: () => '/sessions',
      providesTags: ['VoiceSession'],
    }),

    // Get voice conversation history
    getVoiceConversationHistory: builder.query({
      query: (sessionId) => `/session/${sessionId}/history`,
      providesTags: (result, error, sessionId) => [
        { type: 'VoiceSession', id: sessionId },
      ],
    }),

    // Get voice configuration
    getVoiceConfig: builder.query({
      query: () => '/config',
      providesTags: ['VoiceConfig'],
    }),
  }),
});

export const {
  useStartVoiceSessionMutation,
  useStopVoiceSessionMutation,
  useSendVoiceTextInputMutation,
  useSendVoiceAudioInputMutation,
  useGetActiveVoiceSessionsQuery,
  useGetVoiceConversationHistoryQuery,
  useGetVoiceConfigQuery,
} = voiceApi;
