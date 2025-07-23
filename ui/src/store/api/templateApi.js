import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/environment';

export const templateApi = createApi({
  reducerPath: 'templateApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/templates`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
    credentials: 'same-origin',
  }),
  tagTypes: ['Template', 'Settings'],
  endpoints: (builder) => ({
    // Get all templates
    getAllTemplates: builder.query({
      query: () => '',
      providesTags: ['Template'],
      transformResponse: (response) => response.data
    }),

    // Get templates by type
    getTemplatesByType: builder.query({
      query: (issueType) => `/type/${issueType}`,
      providesTags: (result, error, issueType) => [
        { type: 'Template', id: `TYPE_${issueType}` }
      ],
      transformResponse: (response) => response.data
    }),

    // Get active template for issue type
    getActiveTemplate: builder.query({
      query: (issueType) => `/active/${issueType}`,
      providesTags: (result, error, issueType) => [
        { type: 'Template', id: `ACTIVE_${issueType}` }
      ],
      transformResponse: (response) => response.data
    }),

    // Create template
    createTemplate: builder.mutation({
      query: (template) => ({
        url: '',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['Template'],
      transformResponse: (response) => response.data
    }),

    // Update template
    updateTemplate: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Template', id },
        'Template'
      ],
      transformResponse: (response) => response.data
    }),

    // Delete template
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
      transformResponse: (response) => response.data
    }),

    // Set active template
    setActiveTemplate: builder.mutation({
      query: ({ issueType, templateId }) => ({
        url: `/active/${issueType}/${templateId}`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { issueType }) => [
        { type: 'Template', id: `ACTIVE_${issueType}` },
        'Settings'
      ],
      transformResponse: (response) => response.data
    }),

    // Get settings
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data
    }),

    // Update settings
    updateSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data
    }),

    // Reset to defaults
    resetToDefaults: builder.mutation({
      query: () => ({
        url: '/reset',
        method: 'POST',
      }),
      invalidatesTags: ['Template', 'Settings'],
      transformResponse: (response) => response.data
    }),

    // Export templates
    exportTemplates: builder.mutation({
      query: () => ({
        url: '/export',
        method: 'GET',
      }),
      transformResponse: (response) => response
    }),

    // Import templates
    importTemplates: builder.mutation({
      query: (importData) => ({
        url: '/import',
        method: 'POST',
        body: importData,
      }),
      invalidatesTags: ['Template'],
      transformResponse: (response) => response.data
    }),

    // Duplicate template
    duplicateTemplate: builder.mutation({
      query: ({ id, name }) => ({
        url: `/duplicate/${id}`,
        method: 'POST',
        body: { name },
      }),
      invalidatesTags: ['Template'],
      transformResponse: (response) => response.data
    }),
  }),
})

export const {
  useGetAllTemplatesQuery,
  useGetTemplatesByTypeQuery,
  useGetActiveTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useSetActiveTemplateMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useResetToDefaultsMutation,
  useExportTemplatesMutation,
  useImportTemplatesMutation,
  useDuplicateTemplateMutation,
} = templateApi
