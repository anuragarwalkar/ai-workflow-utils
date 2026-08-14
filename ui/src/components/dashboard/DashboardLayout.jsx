import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import OverviewPage from './OverviewPage';
import ManagePage from './ManagePage';
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
        pt: 3,
        pb: 3,
        pl: 3,
        pr: 1,
        bgcolor: isDark ? '#0f172a' : '#f1f5f9', // slightly different bg for content area to contrast with cards
      }}>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/pr-reviews" element={<PlaceholderPage title="PR Reviews" />} />
          <Route path="/knowledge-base" element={<PlaceholderPage title="Knowledge Base & RAG" />} />
          <Route path="/tasks" element={<PlaceholderPage title="Task & Nag Queue" />} />
          <Route path="/manage" element={<ManagePage />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
