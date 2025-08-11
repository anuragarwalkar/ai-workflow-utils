import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment.js';
import ToastService from '../../services/toastService';

export const environmentSettingsApi = createApi({
  reducerPath: 'environmentSettingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/environment-settings`,
    prepareHeaders: headers => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['EnvironmentSettings', 'Providers'],
  endpoints: builder => ({
    // Get current environment settings
    getEnvironmentSettings: builder.query({
      query: () => '/',
      providesTags: ['EnvironmentSettings'],
    }),

    // Update environment settings
    updateEnvironmentSettings: builder.mutation({
      query: settings => ({
        url: '/',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['EnvironmentSettings', 'Providers'],
      async onQueryStarted(settings, { queryFulfilled }) {
        try {
          await queryFulfilled;
          ToastService.success('Environment settings saved successfully!');
        } catch (error) {
          ToastService.handleApiError(error, 'Failed to save environment settings');
        }
      },
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
      async onQueryStarted({ provider }, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          ToastService.success(`${provider} connection test: ${data.data.message}`);
        } catch (error) {
          ToastService.handleApiError(error, 'Connection test failed');
        }
      },
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
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          ToastService.success('Settings reset to defaults successfully!');
        } catch (error) {
          ToastService.handleApiError(error, 'Failed to reset settings');
        }
      },
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
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          ToastService.success('Settings exported successfully!');
        } catch (error) {
          ToastService.handleApiError(error, 'Failed to export settings');
        }
      },
    }),
    importSettings: builder.mutation({
      query: importData => ({
        url: '/import',
        method: 'POST',
        body: importData,
      }),
      invalidatesTags: ['EnvironmentSettings', 'Providers', 'ProviderConfig'],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          ToastService.success('Settings imported successfully!');
        } catch (error) {
          ToastService.handleApiError(error, 'Failed to import settings');
        }
      },
    }),
  }),
});

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
} = environmentSettingsApi;
