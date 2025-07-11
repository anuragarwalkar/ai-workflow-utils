import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const buildApi = createApi({
  reducerPath: 'buildApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/build',
  }),
  tagTypes: ['Build'],
  endpoints: (builder) => ({
    startBuild: builder.mutation({
      query: () => ({
        url: '/release',
        method: 'POST',
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
