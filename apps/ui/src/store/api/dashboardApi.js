/* eslint-disable max-lines */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/dashboard`,
  }),
  tagTypes: ['Todo', 'Summary', 'Reminder', 'Note', 'TileConfig', 'Notification', 'LanceDb'],
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
      async onQueryStarted(todo, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          dashboardApi.util.updateQueryData('getTodos', undefined, draft => {
            if (draft && Array.isArray(draft.data)) {
              draft.data.unshift({
                id: `temp-${Date.now()}`,
                title: todo.title || todo.text || '',
                done: false,
                priority: todo.priority || 'Medium',
                dueAt: todo.dueAt || null,
                createdAt: new Date().toISOString(),
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateTodo: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/todos/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Todo'],
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          dashboardApi.util.updateQueryData('getTodos', undefined, draft => {
            if (draft && Array.isArray(draft.data)) {
              const item = draft.data.find(t => t.id === id);
              if (item) {
                Object.assign(item, patch);
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteTodo: builder.mutation({
      query: id => ({
        url: `/todos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Todo'],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          dashboardApi.util.updateQueryData('getTodos', undefined, draft => {
            if (draft && Array.isArray(draft.data)) {
              const idx = draft.data.findIndex(t => t.id === id);
              if (idx !== -1) {
                draft.data.splice(idx, 1);
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    reorderTodos: builder.mutation({
      query: orderedIds => ({
        url: '/todos/reorder',
        method: 'PUT',
        body: { orderedIds },
      }),
      invalidatesTags: ['Todo'],
      async onQueryStarted(orderedIds, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          dashboardApi.util.updateQueryData('getTodos', undefined, draft => {
            if (draft && Array.isArray(draft.data)) {
              const map = new Map(draft.data.map(t => [t.id, t]));
              const reordered = [];
              for (const id of orderedIds) {
                if (map.has(id)) {
                  reordered.push(map.get(id));
                  map.delete(id);
                }
              }
              for (const rem of map.values()) {
                reordered.push(rem);
              }
              draft.data = reordered;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
    // Models
    getAvailableModels: builder.query({
      query: () => '/models',
      providesTags: ['Models'],
    }),
    // Notifications
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    getUnreadNotificationCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: id => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation({
      query: id => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
    clearAllNotifications: builder.mutation({
      query: () => ({
        url: '/notifications',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
    triggerTestNotification: builder.mutation({
      query: data => ({
        url: '/notifications/test',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification', 'Reminder', 'Todo'],
    }),
    // Vector DB / LanceDB Explorer
    getLanceDbStats: builder.query({
      query: () => '/lancedb/stats',
      providesTags: ['LanceDb'],
    }),
    getLanceDbTableRecords: builder.query({
      query: (params = {}) => {
        const { tableName = 'summaries', limit = 50, offset = 0, type, search } = params;
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit);
        if (offset) queryParams.append('offset', offset);
        if (type && type !== 'all') queryParams.append('type', type);
        if (search) queryParams.append('search', search);
        return `/lancedb/tables/${tableName}/records?${queryParams.toString()}`;
      },
      providesTags: ['LanceDb'],
    }),
    getLanceDbTableSchema: builder.query({
      query: (tableName = 'summaries') => `/lancedb/tables/${tableName}/schema`,
      providesTags: ['LanceDb'],
    }),
    deleteLanceDbRecord: builder.mutation({
      query: ({ tableName = 'summaries', id }) => ({
        url: `/lancedb/tables/${tableName}/records/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LanceDb'],
    }),
    deleteLanceDbRecords: builder.mutation({
      query: ({ tableName = 'summaries', ids = [], deleteAll = false, type = null }) => ({
        url: `/lancedb/tables/${tableName}/records/bulk-delete`,
        method: 'POST',
        body: { ids, deleteAll, type },
      }),
      invalidatesTags: ['LanceDb'],
    }),
    insertLanceDbRecord: builder.mutation({
      query: data => ({
        url: '/lancedb/records',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LanceDb'],
    }),
    reindexLanceDbNotes: builder.mutation({
      query: () => ({
        url: '/lancedb/reindex',
        method: 'POST',
      }),
      invalidatesTags: ['LanceDb', 'Note'],
    }),
    searchLanceDb: builder.mutation({
      query: ({ query, limit = 5, tableName = 'summaries' }) => ({
        url: '/lancedb/search',
        method: 'POST',
        body: { query, limit, tableName },
      }),
    }),
    getLanceDbDiagnostics: builder.query({
      query: () => '/lancedb/diagnostics',
      providesTags: ['LanceDb'],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useReorderTodosMutation,
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
  useGetAvailableModelsQuery,
  useProcessCommandMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useTriggerTestNotificationMutation,
  useGetLanceDbStatsQuery,
  useGetLanceDbTableRecordsQuery,
  useGetLanceDbTableSchemaQuery,
  useDeleteLanceDbRecordMutation,
  useDeleteLanceDbRecordsMutation,
  useInsertLanceDbRecordMutation,
  useReindexLanceDbNotesMutation,
  useSearchLanceDbMutation,
  useGetLanceDbDiagnosticsQuery,
} = dashboardApi;
