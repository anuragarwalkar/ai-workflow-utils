import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const emailApi = createApi({
  reducerPath: 'emailApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/email`,
    responseHandler: (response) => response.text(),
  }),
  tagTypes: ['Email'],
  endpoints: (builder) => ({
    sendEmail: builder.mutation({
      query: ({ version, dryRun = true, wikiUrl, wikiBasicAuth }) => ({
        url: `/send?version=${version}&dryRun=${dryRun}`,
        method: 'POST',
        body: JSON.stringify({
          wikiUrl,
          wikiBasicAuth
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    composeWithAI: builder.mutation({
      query: ({ prompt, attachedImages = [] }) => ({
        url: '/ai-compose',
        method: 'POST',
        body: JSON.stringify({
          prompt,
          attachedImages
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        responseHandler: (response) => response.json(),
      }),
    }),
    sendAIEmail: builder.mutation({
      query: ({ to, subject, body, attachments = [] }) => ({
        url: '/ai-send',
        method: 'POST',
        body: JSON.stringify({
          to,
          subject,
          body,
          attachments
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        responseHandler: (response) => response.json(),
      }),
    }),
    searchContacts: builder.query({
      query: (query) => `/contacts/${encodeURIComponent(query)}`,
      responseHandler: (response) => response.json(),
    }),
  }),
});

export const {
  useSendEmailMutation,
  useComposeWithAIMutation,
  useSendAIEmailMutation,
  useSearchContactsQuery,
} = emailApi;
