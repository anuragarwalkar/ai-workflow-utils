import React, { Suspense } from 'react';
import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import DashboardSkeleton from './DashboardSkeleton';
import ErrorBoundary from '../common/ErrorBoundary';
import {
  DashboardManagePage,
  DashboardNotesPage,
  DashboardOverviewPage,
  DashboardVectorDbPage,
} from '../../routes/lazyComponents';
import { useAppTheme } from '../../theme/useAppTheme';

// Placeholder components for other pages
const PlaceholderPage = ({ title }) => {
  const { isDark } = useAppTheme();
  return (
    <Box sx={{ p: 4, color: isDark ? '#f8fafc' : '#0f172a' }}>
      <h1>{title}</h1>
      <p>This page is under construction.</p>
    </Box>
  );
};

const DashboardLayout = () => {
  const { isDark } = useAppTheme();

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      bgcolor: isDark ? '#1e293b' : '#ffffff', // main background behind tiles
    }}>
      <DashboardSidebar />
      <Box sx={{
        flexGrow: 1,
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        pt: 3,
        pb: 3,
        pl: 3,
        pr: 3,
        bgcolor: isDark ? '#0f172a' : '#f1f5f9', // content area bg
      }}>
        {/* Floating Notification Bell in top right */}
        <DashboardHeader />

        {/* Nested ErrorBoundary & Suspense boundary so sidebar & header stay intact during tab switching */}
        <ErrorBoundary friendlyMessage="Failed to load dashboard tab. Please try switching tabs or reload.">
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
              <Route element={<DashboardOverviewPage />} path="/" />
              <Route element={<DashboardNotesPage />} path="/notes" />
              <Route element={<DashboardNotesPage />} path="/notes/:id" />
              <Route element={<PlaceholderPage title="PR Reviews" />} path="/pr-reviews" />
              <Route element={<DashboardVectorDbPage />} path="/vector-db" />
              <Route element={<DashboardVectorDbPage />} path="/knowledge-base" />
              <Route element={<PlaceholderPage title="Task & Nag Queue" />} path="/tasks" />
              <Route element={<DashboardManagePage />} path="/manage" />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
