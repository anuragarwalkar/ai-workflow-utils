import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/dashboard`,
  }),
  tagTypes: ['Todo', 'SlackItem', 'Summary', 'SlackChannel', 'Reminder', 'Note', 'TileConfig'],
  endpoints: builder => ({
    // Slack
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
    // Todos
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
    // Reminders
    getReminders: builder.query({
      query: () => '/reminders',
      providesTags: ['Reminder'],
    }),
    createReminder: builder.mutation({
      query: reminder => ({
        url: '/reminders',
        method: 'POST',
        body: reminder,
      }),
      invalidatesTags: ['Reminder'],
    }),
    updateReminder: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/reminders/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Reminder'],
    }),
    deleteReminder: builder.mutation({
      query: id => ({
        url: `/reminders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reminder'],
    }),
    // Notes
    getNotes: builder.query({
      query: () => '/notes',
      providesTags: ['Note'],
    }),
    createNote: builder.mutation({
      query: note => ({
        url: '/notes',
        method: 'POST',
        body: note,
      }),
      invalidatesTags: ['Note'],
    }),
    updateNote: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/notes/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Note'],
    }),
    deleteNote: builder.mutation({
      query: id => ({
        url: `/notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Note'],
    }),
    // Tile Config
    getTileConfig: builder.query({
      query: () => '/tiles/config',
      providesTags: ['TileConfig'],
    }),
    updateTileConfig: builder.mutation({
      query: config => ({
        url: '/tiles/config',
        method: 'PUT',
        body: config,
      }),
      invalidatesTags: ['TileConfig'],
    }),
    // Legacy / Other
    summarizeText: builder.mutation({
      query: text => ({
        url: '/summarize',
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Summary', 'Note'],
    }),
    searchSummaries: builder.mutation({
      query: ({ query, limit }) => ({
        url: '/summaries/search',
        method: 'POST',
        body: { query, limit },
      }),
    }),
    // We handle processCommand differently if it's streaming, but we can add a non-streaming mutation just in case
    processCommand: builder.mutation({
      query: ({ text }) => ({
        url: '/command',
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: ['Todo', 'Reminder', 'Note'],
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
  useGetRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useDeleteReminderMutation,
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useGetTileConfigQuery,
  useUpdateTileConfigMutation,
  useSummarizeTextMutation,
  useSearchSummariesMutation,
  useProcessCommandMutation,
} = dashboardApi;
