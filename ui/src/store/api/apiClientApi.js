import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';

// API Client RTK Query API
export const apiClientApi = createApi({
  reducerPath: 'apiClientApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/api-client`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['ApiRequest', 'Environment', 'Collection', 'Response'],
  endpoints: (builder) => ({
    // Execute API request
    executeRequest: builder.mutation({
      query: (requestData) => ({
        url: '/execute',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Response'],
    }),
    
    // Environments endpoints
    getEnvironments: builder.query({
      query: () => '/environments',
      providesTags: ['Environment'],
      transformResponse: (response) => {
        if (!response.success) return [];
        
        // Transform environments to have variables object instead of values array
        return response.data.environments.map(env => ({
          ...env,
          variables: env.values ? env.values.reduce((acc, item) => {
            if (item.enabled !== false) {
              acc[item.key] = item.value;
            }
            return acc;
          }, {}) : {}
        }));
      },
    }),
    
    getActiveEnvironment: builder.query({
      query: () => '/environments/active',
      providesTags: ['Environment'],
      transformResponse: (response) => {
        if (!response.success || !response.data) return null;
        
        const env = response.data;
        // Transform active environment to have variables object instead of values array
        return {
          ...env,
          variables: env.values ? env.values.reduce((acc, item) => {
            if (item.enabled !== false) {
              acc[item.key] = item.value;
            }
            return acc;
          }, {}) : {}
        };
      },
    }),
    
    createEnvironment: builder.mutation({
      query: (environmentData) => ({
        url: '/environments',
        method: 'POST',
        body: environmentData,
      }),
      invalidatesTags: ['Environment'],
    }),
    
    updateEnvironment: builder.mutation({
      query: ({ id, ...environmentData }) => ({
        url: `/environments/${id}`,
        method: 'PUT',
        body: environmentData,
      }),
      invalidatesTags: ['Environment'],
    }),
    
    deleteEnvironment: builder.mutation({
      query: (id) => ({
        url: `/environments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Environment'],
    }),
    
    setActiveEnvironment: builder.mutation({
      query: (id) => ({
        url: `/environments/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Environment'],
    }),
    
    importEnvironment: builder.mutation({
      query: (environmentData) => ({
        url: '/environments/import',
        method: 'POST',
        body: environmentData,
      }),
      invalidatesTags: ['Environment'],
    }),
    
    exportEnvironment: builder.query({
      query: (id) => `/environments/${id}/export`,
    }),
    
    // Collections endpoints
    getCollections: builder.query({
      query: () => '/collections',
      providesTags: ['Collection'],
      transformResponse: (response) => response.success ? response.data : [],
    }),
    
    createCollection: builder.mutation({
      query: (collectionData) => ({
        url: '/collections',
        method: 'POST',
        body: collectionData,
      }),
      invalidatesTags: ['Collection'],
    }),
    
    updateCollection: builder.mutation({
      query: ({ id, ...collectionData }) => ({
        url: `/collections/${id}`,
        method: 'PUT',
        body: collectionData,
      }),
      invalidatesTags: ['Collection'],
    }),
    
    deleteCollection: builder.mutation({
      query: (id) => ({
        url: `/collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),
    
    importCollection: builder.mutation({
      query: (collectionData) => ({
        url: '/collections/import',
        method: 'POST',
        body: collectionData,
      }),
      invalidatesTags: ['Collection'],
    }),
    
    exportCollection: builder.query({
      query: (id) => `/collections/${id}/export`,
    }),
  }),
});

export const {
  useExecuteRequestMutation,
  useGetEnvironmentsQuery,
  useGetActiveEnvironmentQuery,
  useCreateEnvironmentMutation,
  useUpdateEnvironmentMutation,
  useDeleteEnvironmentMutation,
  useSetActiveEnvironmentMutation,
  useImportEnvironmentMutation,
  useLazyExportEnvironmentQuery,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useImportCollectionMutation,
  useLazyExportCollectionQuery,
} = apiClientApi;
