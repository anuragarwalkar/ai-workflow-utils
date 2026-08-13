import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/dashboard',
  }),
  tagTypes: ['Todo', 'SlackItem', 'Summary', 'SlackChannel'],
  endpoints: builder => ({
    getSlackItems: builder.query({
      query: () => '/slack/items',
      providesTags: ['SlackItem'],
    }),
    getSlackChannels: builder.query({
      query: () => '/slack/channels',
      providesTags: ['SlackChannel'],
    }),
    testSlackConnection: builder.mutation({
      query: () => ({
        url: '/slack/test',
        method: 'POST',
      }),
    }),
    getTodos: builder.query({
      query: () => '/todos',
      providesTags: ['Todo'],
    }),
    createTodo: builder.mutation({
      query: todo => ({
        url: '/todos',
        method: 'POST',
        body: todo,
      }),
      invalidatesTags: ['Todo'],
    }),
    updateTodo: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/todos/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Todo'],
    }),
    deleteTodo: builder.mutation({
      query: id => ({
        url: `/todos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Todo'],
    }),
    summarizeText: builder.mutation({
      query: text => ({
        url: '/summarize',
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Summary'],
    }),
    searchSummaries: builder.mutation({
      query: ({ query, limit }) => ({
        url: '/summaries/search',
        method: 'POST',
        body: { query, limit },
      }),
    }),
  }),
});

export const {
  useGetSlackItemsQuery,
  useGetSlackChannelsQuery,
  useTestSlackConnectionMutation,
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useSummarizeTextMutation,
  useSearchSummariesMutation,
} = dashboardApi;
