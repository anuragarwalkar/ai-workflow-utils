import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const jiraApi = createApi({
  reducerPath: 'jiraApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
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
    createJira: builder.mutation({
      query: ({ summary, description, issueType, priority }) => ({
        url: '/generate',
        method: 'POST',
        body: { summary, description, issueType, priority },
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
    createPullRequest: builder.mutation({
      query: ({ ticketNumber, updatedList, branchName, projectKey, repoSlug }) => ({
        url: '/create-pr',
        method: 'POST',
        body: { ticketNumber, updatedList, branchName, projectKey, repoSlug },
      }),
    }),
  }),
});

export const {
  usePreviewJiraMutation,
  useCreateJiraMutation,
  useFetchJiraQuery,
  useLazyFetchJiraQuery,
  useUploadAttachmentMutation,
  useCreatePullRequestMutation,
} = jiraApi;
