import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/dashboard`,
  }),
  tagTypes: ['Todo', 'Summary', 'Reminder', 'Note', 'TileConfig'],
  endpoints: builder => ({
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
    getNoteById: builder.query({
      query: id => `/notes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Note', id }],
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
      invalidatesTags: (result, error, { id }) => ['Note', { type: 'Note', id }],
    }),
    deleteNote: builder.mutation({
      query: id => ({
        url: `/notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Note'],
    }),
    toggleNotePin: builder.mutation({
      query: id => ({
        url: `/notes/${id}/pin`,
        method: 'POST',
      }),
      invalidatesTags: ['Note'],
    }),
    toggleNoteFavorite: builder.mutation({
      query: id => ({
        url: `/notes/${id}/favorite`,
        method: 'POST',
      }),
      invalidatesTags: ['Note'],
    }),
    summarizeNote: builder.mutation({
      query: ({ id, prompt }) => ({
        url: `/notes/${id}/summarize`,
        method: 'POST',
        body: { prompt },
      }),
      invalidatesTags: ['Note'],
    }),
    autoTagNote: builder.mutation({
      query: id => ({
        url: `/notes/${id}/auto-tag`,
        method: 'POST',
      }),
      invalidatesTags: ['Note'],
    }),
    expandNote: builder.mutation({
      query: ({ id, instruction }) => ({
        url: `/notes/${id}/expand`,
        method: 'POST',
        body: { instruction },
      }),
      invalidatesTags: ['Note'],
    }),
    generateNote: builder.mutation({
      query: ({ prompt, autoSave }) => ({
        url: '/notes/generate',
        method: 'POST',
        body: { prompt, autoSave },
      }),
      invalidatesTags: ['Note'],
    }),
    getRelatedNotes: builder.query({
      query: ({ id, limit = 5 }) => `/notes/${id}/related?limit=${limit}`,
      providesTags: (result, error, { id }) => [{ type: 'Note', id: `related-${id}` }],
    }),
    improveWriting: builder.mutation({
      query: ({ text, mode }) => ({
        url: '/notes/improve-writing',
        method: 'POST',
        body: { text, mode },
      }),
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
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useGetRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useDeleteReminderMutation,
  useGetNotesQuery,
  useGetNoteByIdQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useToggleNotePinMutation,
  useToggleNoteFavoriteMutation,
  useSummarizeNoteMutation,
  useAutoTagNoteMutation,
  useExpandNoteMutation,
  useGenerateNoteMutation,
  useGetRelatedNotesQuery,
  useImproveWritingMutation,
  useGetTileConfigQuery,
  useUpdateTileConfigMutation,
  useSummarizeTextMutation,
  useSearchSummariesMutation,
  useProcessCommandMutation,
} = dashboardApi;
