import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const emailApi = createApi({
  reducerPath: 'emailApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api/email',
    responseHandler: (response) => response.text(),
  }),
  tagTypes: ['Email'],
  endpoints: (builder) => ({
    sendEmail: builder.mutation({
      query: ({ version, dryRun = true }) => ({
        url: `/send?version=${version}&dryRun=${dryRun}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useSendEmailMutation,
} = emailApi;
