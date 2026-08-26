/* eslint-disable max-statements */
/* eslint-disable no-console */
/* eslint-disable max-lines */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Clear as ClearIcon,
  BugReport as DebugIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useClearLogsMutation, useGetLogsQuery } from '../../../store/api/logsApi';
import { API_BASE_URL } from '../../../config/environment.js';


const LogsViewer = () => {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Use debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedLevel, debouncedSearch]);

  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useGetLogsQuery(
    {
      level: selectedLevel,
      search: debouncedSearch,
      page: page + 1,
      limit: rowsPerPage,
    },
    {
      pollingInterval: autoRefresh ? 5000 : 0,
      refetchOnMountOrArgChange: true,
    }
  );

  const [clearLogs, { isLoading: isClearing }] = useClearLogsMutation();

  const logLevels = [
    { value: 'all', label: 'All Levels', color: 'default' },
    { value: 'error', label: 'Error', color: 'error' },
    { value: 'warn', label: 'Warning', color: 'warning' },
    { value: 'info', label: 'Info', color: 'info' },
    { value: 'debug', label: 'Debug', color: 'default' },
  ];

  const getLogIcon = level => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />;
      case 'warn':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 16 }} />;
      case 'info':
        return <InfoIcon sx={{ color: 'info.main', fontSize: 16 }} />;
      case 'debug':
        return <DebugIcon sx={{ color: 'text.secondary', fontSize: 16 }} />;
      default:
        return <InfoIcon sx={{ color: 'text.secondary', fontSize: 16 }} />;
    }
  };

  const getLogColor = level => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleLevelChange = event => {
    setSelectedLevel(event.target.value);
    // Force immediate refetch when level changes
    setTimeout(() => refetch(), 100);
  };

  const handleSearchChange = event => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setTimeout(() => refetch(), 100);
  };

  const handleDownloadLogs = async () => {
    try {
       const response = await fetch(`${API_BASE_URL}/api/logs/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download logs:', error);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        await clearLogs().unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  };

  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading logs...</Typography>
      </Box>
    );
  }

  if (error) {
    console.error('Logs API Error:', error);
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        <Typography variant='subtitle2'>Failed to load logs</Typography>
        <Typography variant='body2'>
          {error.message || error.data?.error || 'Unknown error occurred'}
        </Typography>
        <Button sx={{ mt: 1 }} onClick={() => refetch()}>
          Retry
        </Button>
      </Alert>
    );
  }

  const logs = logsData?.data?.logs || [];
  const totalCount = logsData?.data?.total || 0;
  const stats = logsData?.data?.stats || {};

  // Debug logging
  console.log('Logs Viewer Debug:', {
    selectedLevel,
    debouncedSearch,
    page,
    totalLogs: logs.length,
    sampleLog: logs[0],
    stats,
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ mb: 2 }} variant='h6'>
          Application Logs
        </Typography>

        {/* Stats Cards */}
        {Object.keys(stats).length > 0 && (
          <Stack direction='row' spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([level, count]) => (
              <Card key={level} sx={{ minWidth: 100, flex: '0 1 auto' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getLogIcon(level)}
                    <Box>
                      <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }} variant='h6'>
                        {count}
                      </Typography>
                      <Typography
                        color='text.secondary'
                        sx={{ textTransform: 'capitalize' }}
                        variant='caption'
                      >
                        {level}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Filters and Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack
            alignItems={{ xs: 'stretch', sm: 'center' }}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel>Log Level</InputLabel>
              <Select label='Log Level' value={selectedLevel} onChange={handleLevelChange}>
                {logLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder='Search logs...'
              size='small'
              sx={{ flex: 1, minWidth: 250 }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Stack>

          <Stack alignItems='center' direction='row' flexWrap='wrap' spacing={1}>
            <Tooltip title='Refresh Logs'>
              <IconButton disabled={isLoading} size='small' onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title='Download All Logs'>
              <IconButton size='small' onClick={handleDownloadLogs}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title='Clear All Logs'>
              <IconButton
                color='error'
                disabled={isClearing}
                size='small'
                onClick={handleClearLogs}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>

            <Button
              size='small'
              variant={autoRefresh ? 'contained' : 'outlined'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto Refresh {autoRefresh ? '(5s)' : null}
            </Button>

            {selectedLevel !== 'all' || debouncedSearch ? (
              <Chip
                color='primary'
                label={`Filtered: ${
                  selectedLevel !== 'all' ? selectedLevel.toUpperCase() : ''
                }${selectedLevel !== 'all' && debouncedSearch ? ' + ' : ''}${
                  debouncedSearch ? `"${debouncedSearch}"` : ''
                }`}
                size='small'
                onDelete={() => {
                  setSelectedLevel('all');
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
              />
            ) : null}

            {totalCount > 0 && (
              <Typography color='text.secondary' sx={{ ml: 'auto' }} variant='body2'>
                {totalCount} total logs
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* Logs Table */}
      <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 600 }}>
        <Table stickyHeader size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>Level</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell align='center' colSpan={4} sx={{ py: 4 }}>
                  <Typography color='text.secondary'>
                    {isLoading ? 'Loading logs...' : 'No logs found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => {
                const getBgColor = () => {
                  const level = log.level?.toLowerCase();
                  if (level === 'error') return 'rgba(244, 67, 54, 0.08)';
                  if (level === 'warn') return 'rgba(255, 152, 0, 0.08)';
                  return 'inherit';
                };

                return (
                  <TableRow
                    key={`${log.timestamp}-${index}`}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      bgcolor: getBgColor(),
                    }}
                  >
                    <TableCell>
                      <Typography
                        sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                        variant='body2'
                      >
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getLogColor(log.level)}
                        icon={getLogIcon(log.level)}
                        label={log.level?.toUpperCase() || 'INFO'}
                        size='small'
                        sx={{
                          fontSize: '0.7rem',
                          height: 24,
                          minWidth: 70,
                          '& .MuiChip-label': {
                            fontWeight: 'bold',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem' }} variant='body2'>
                        {log.module || log.source || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          wordBreak: 'break-word',
                          fontFamily:
                            log.level?.toLowerCase() === 'error' ? 'monospace' : 'inherit',
                          maxWidth: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        variant='body2'
                      >
                        {log.message}
                        {log.meta && Object.keys(log.meta).length > 0 ? (
                          <Box
                            component='pre'
                            sx={{
                              mt: 0.5,
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              bgcolor: 'grey.100',
                              p: 0.5,
                              borderRadius: 0.5,
                            }}
                          >
                            {JSON.stringify(log.meta, null, 2)}
                          </Box>
                        ) : null}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalCount > 0 && (
        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Box>
  );
};

export default LogsViewer;
