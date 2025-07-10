import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const jiraApi = createApi({
  reducerPath: 'jiraApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Jira'],
  endpoints: (builder) => ({
    previewJira: builder.mutation({
      query: ({ prompt, images }) => ({
        url: '/preview',
        method: 'POST',
        body: { prompt, images },
      }),
    }),
    createJira: builder.mutation({
      query: ({ summary, description }) => ({
        url: '/generate',
        method: 'POST',
        body: { summary, description },
      }),
      invalidatesTags: ['Jira'],
    }),
    fetchJira: builder.query({
      query: (jiraId) => `/issue/${jiraId}`,
      providesTags: (result, error, jiraId) => [{ type: 'Jira', id: jiraId }],
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
  useCreateJiraMutation,
  useFetchJiraQuery,
  useLazyFetchJiraQuery,
  useUploadAttachmentMutation,
} = jiraApi;
