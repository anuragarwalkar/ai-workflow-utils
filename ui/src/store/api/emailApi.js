import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

export const emailApi = createApi({
  reducerPath: 'emailApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/email`,
    responseHandler: (response) => response.text(),
  }),
  tagTypes: ['Email'],
  endpoints: (builder) => ({
    sendEmail: builder.mutation({
      query: ({ version, dryRun = true, wikiUrl, wikiBasicAuth }) => ({
        url: `/send?version=${version}&dryRun=${dryRun}`,
        method: 'POST',
        body: JSON.stringify({
          wikiUrl,
          wikiBasicAuth
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
});

export const {
  useSendEmailMutation,
} = emailApi;
