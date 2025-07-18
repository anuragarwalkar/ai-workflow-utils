import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const prApi = createApi({
  reducerPath: 'prApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/pr`,
  }),
  tagTypes: ['PullRequest', 'PRReview'],
  endpoints: (builder) => ({
    getPullRequests: builder.query({
      query: ({ projectKey, repoSlug }) => `/${projectKey}/${repoSlug}/pull-requests`,
      providesTags: (result, error, { projectKey, repoSlug }) => [
        { type: 'PullRequest', id: `${projectKey}-${repoSlug}` }
      ],
    }),
    getPullRequestDiff: builder.query({
      query: ({ projectKey, repoSlug, pullRequestId }) => 
        `/${projectKey}/${repoSlug}/pull-requests/${pullRequestId}/diff`,
      providesTags: (result, error, { projectKey, repoSlug, pullRequestId }) => [
        { type: 'PullRequest', id: `${projectKey}-${repoSlug}-${pullRequestId}` }
      ],
    }),
    reviewPullRequest: builder.mutation({
      query: ({ projectKey, repoSlug, pullRequestId, diffData, prDetails }) => ({
        url: '/review',
        method: 'POST',
        body: { projectKey, repoSlug, pullRequestId, diffData, prDetails },
      }),
      invalidatesTags: (result, error, { projectKey, repoSlug, pullRequestId }) => [
        { type: 'PRReview', id: `${projectKey}-${repoSlug}-${pullRequestId}` }
      ],
    }),
    createPullRequest: builder.mutation({
      query: ({ ticketNumber, updatedList, branchName, projectKey, repoSlug }) => ({
        url: '/create',
        method: 'POST',
        body: { ticketNumber, updatedList, branchName, projectKey, repoSlug },
      }),
    }),
  }),
});

export const {
  useGetPullRequestsQuery,
  useLazyGetPullRequestsQuery,
  useGetPullRequestDiffQuery,
  useLazyGetPullRequestDiffQuery,
  useReviewPullRequestMutation,
  useCreatePullRequestMutation,
} = prApi;
