import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment';

export const mcpApi = createApi({
  reducerPath: 'mcpApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/mcp/`,
  }),
  tagTypes: ['MCPClient'],
  endpoints: (builder) => ({
    getMCPClients: builder.query({
      query: () => 'clients',
      providesTags: ['MCPClient'],
    }),
    createMCPClient: builder.mutation({
      query: (client) => ({
        url: 'clients',
        method: 'POST',
        body: client,
      }),
      invalidatesTags: ['MCPClient'],
    }),
    updateMCPClient: builder.mutation({
      query: ({ id, ...client }) => ({
        url: `clients/${id}`,
        method: 'PUT',
        body: client,
      }),
      invalidatesTags: ['MCPClient'],
    }),
    deleteMCPClient: builder.mutation({
      query: (id) => ({
        url: `clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MCPClient'],
    }),
    testMCPConnection: builder.mutation({
      query: (id) => ({
        url: `clients/${id}/test`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetMCPClientsQuery,
  useCreateMCPClientMutation,
  useUpdateMCPClientMutation,
  useDeleteMCPClientMutation,
  useTestMCPConnectionMutation,
} = mcpApi;
