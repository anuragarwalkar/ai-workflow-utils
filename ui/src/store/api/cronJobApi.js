import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const cronJobApi = createApi({
  reducerPath: 'cronJobApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/cron-jobs`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['CronJob'],
  endpoints: (builder) => ({
    getAllCronJobs: builder.query({
      query: () => '',
      transformResponse: (response) => response.data || [],
      providesTags: ['CronJob'],
    }),
    getCronJobById: builder.query({
      query: (id) => `/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'CronJob', id }],
    }),
    createCronJob: builder.mutation({
      query: (newJob) => ({
        url: '',
        method: 'POST',
        body: newJob,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['CronJob'],
    }),
    updateCronJob: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CronJob', id }, 'CronJob'],
    }),
    deleteCronJob: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['CronJob'],
    }),
    toggleCronJob: builder.mutation({
      query: (id) => ({
        url: `/${id}/toggle`,
        method: 'PATCH',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, id) => [{ type: 'CronJob', id }, 'CronJob'],
    }),
    getCronJobLogs: builder.query({
      query: ({ id, limit = 20 }) => ({
        url: `/${id}/logs`,
        params: { limit },
      }),
      transformResponse: (response) => response.data || [],
    }),
    triggerCronJobManually: builder.mutation({
      query: (id) => ({
        url: `/${id}/trigger`,
        method: 'POST',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_result, _error, id) => [{ type: 'CronJob', id }, 'CronJob'],
    }),
    validateCronExpression: builder.mutation({
      query: (expression) => ({
        url: '/validate-expression',
        method: 'POST',
        body: { expression },
      }),
      transformResponse: (response) => response.data,
    }),
    convertScheduleToCron: builder.mutation({
      query: (schedule) => ({
        url: '/convert-schedule',
        method: 'POST',
        body: { schedule },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGetAllCronJobsQuery,
  useGetCronJobByIdQuery,
  useCreateCronJobMutation,
  useUpdateCronJobMutation,
  useDeleteCronJobMutation,
  useToggleCronJobMutation,
  useGetCronJobLogsQuery,
  useTriggerCronJobManuallyMutation,
  useValidateCronExpressionMutation,
  useConvertScheduleToCronMutation,
} = cronJobApi;