import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const logsApi = createApi({
  reducerPath: 'logsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/logs`,
  }),
  tagTypes: ['Logs'],
  endpoints: builder => ({
    getLogs: builder.query({
      query: ({ level = 'all', search = '', page = 1, limit = 25 } = {}) => {
        const params = new URLSearchParams({
          ...(level !== 'all' && { level }),
          ...(search && { search }),
          page: page.toString(),
          limit: limit.toString(),
        });
        return `?${params.toString()}`;
      },
      providesTags: ['Logs'],
    }),
    clearLogs: builder.mutation({
      query: () => ({
        url: '/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Logs'],
    }),
  }),
});

export const { useGetLogsQuery, useClearLogsMutation } = logsApi;
