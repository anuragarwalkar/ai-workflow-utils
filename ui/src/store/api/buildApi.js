import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const buildApi = createApi({
  reducerPath: 'buildApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/build`,
  }),
  tagTypes: ['Build'],
  endpoints: builder => ({
    startBuild: builder.mutation({
      query: buildConfig => ({
        url: '/release',
        method: 'POST',
        body: buildConfig,
      }),
      invalidatesTags: ['Build'],
    }),
    getBuildStatus: builder.query({
      query: () => '/status',
      providesTags: ['Build'],
    }),
  }),
});

export const {
  useStartBuildMutation,
  useGetBuildStatusQuery,
  useLazyGetBuildStatusQuery,
} = buildApi;
