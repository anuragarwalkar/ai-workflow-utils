import React from 'react';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { log } from '../../utils/log';

const getStatusColor = (status) => {
  const colors = { active: 'success', running: 'warning', failed: 'error' };
  return colors[status] || 'default';
};

const getStatusIcon = (status) => {
  if (status === 'success') return <CheckCircleIcon sx={{ fontSize: 18 }} />;
  if (status === 'error') return <ErrorIcon sx={{ fontSize: 18 }} />;
  return <ScheduleIcon sx={{ fontSize: 18 }} />;
};

const HistoryTableHeader = () => (
  <TableHead>
    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
      <TableCell>Job Name</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Last Run</TableCell>
      <TableCell align='right'>Runs</TableCell>
    </TableRow>
  </TableHead>
);

const HistoryTableBody = ({ jobsWithHistory }) => (
  <TableBody>
    {jobsWithHistory.map(job => (
      <TableRow key={job.id}>
        <TableCell>
          <Typography variant='body2'>
            {job.name}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            color={getStatusColor(job.status)}
            icon={getStatusIcon(job.status)}
            label={job.status}
            size='small'
          />
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '12px' }} variant='caption'>
            {job.lastRun
              ? new Date(job.lastRun).toLocaleString()
              : 'Never'}
          </Typography>
        </TableCell>
        <TableCell align='right'>
          <Typography sx={{ fontSize: '12px' }} variant='caption'>
            {job.runCount || 0}
          </Typography>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
);

const ExecutionHistory = ({ cronJobs }) => {
  const jobsWithHistory = cronJobs
    .filter(job => job.lastRun || job.lastRunStatus)
    .sort((a, b) => new Date(b.lastRun || 0) - new Date(a.lastRun || 0))
    .slice(0, 10);

  log('[EXECUTION_HISTORY] [render] History', { count: jobsWithHistory.length });

  if (jobsWithHistory.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography gutterBottom sx={{ mb: 2 }} variant='h6'>
        Last Executions
      </Typography>
      <TableContainer>
        <Table size='small'>
          <HistoryTableHeader />
          <HistoryTableBody jobsWithHistory={jobsWithHistory} />
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExecutionHistory;
