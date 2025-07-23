import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../../config/environment.js';

export const environmentSettingsApi = createApi({
  reducerPath: 'environmentSettingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/environment-settings`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['EnvironmentSettings', 'Providers'],
  endpoints: (builder) => ({
    // Get current environment settings
    getEnvironmentSettings: builder.query({
      query: () => '/',
      providesTags: ['EnvironmentSettings'],
    }),

    // Update environment settings
    updateEnvironmentSettings: builder.mutation({
      query: (settings) => ({
        url: '/',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['EnvironmentSettings', 'Providers'],
    }),

    // Get provider status
    getProviders: builder.query({
      query: () => '/providers',
      providesTags: ['Providers'],
    }),

    // Test connection
    testConnection: builder.mutation({
      query: ({ provider, config }) => ({
        url: '/test',
        method: 'POST',
        body: { provider, config },
      }),
    }),

    // Get default configuration
    getDefaults: builder.query({
      query: () => '/defaults',
    }),

    // Reset to defaults
    resetSettings: builder.mutation({
      query: () => ({
        url: '/reset',
        method: 'POST',
      }),
      invalidatesTags: ['EnvironmentSettings', 'Providers'],
    }),
    getProviderConfig: builder.query({
      query: () => '/config',
      providesTags: ['ProviderConfig'],
    }),
    getSchema: builder.query({
      query: () => '/schema',
      providesTags: ['Schema'],
    }),
    exportSettings: builder.mutation({
      query: () => ({
        url: '/export',
        method: 'POST',
      }),
    }),
    importSettings: builder.mutation({
      query: (importData) => ({
        url: '/import',
        method: 'POST',
        body: importData,
      }),
      invalidatesTags: ['EnvironmentSettings', 'Providers', 'ProviderConfig'],
    }),
  }),
})

export const {
  useGetEnvironmentSettingsQuery,
  useUpdateEnvironmentSettingsMutation,
  useGetProvidersQuery,
  useTestConnectionMutation,
  useGetDefaultsQuery,
  useResetSettingsMutation,
  useGetProviderConfigQuery,
  useGetSchemaQuery,
  useExportSettingsMutation,
  useImportSettingsMutation,
} = environmentSettingsApi
