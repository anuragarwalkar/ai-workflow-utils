import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as DebugIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useGetLogsQuery,
  useClearLogsMutation,
} from '../../../store/api/logsApi';

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
      const response = await fetch('/api/logs/download', {
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
    if (
      window.confirm(
        'Are you sure you want to clear all logs? This action cannot be undone.'
      )
    ) {
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
        <Button onClick={() => refetch()} sx={{ mt: 1 }}>
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
        <Typography variant='h6' sx={{ mb: 2 }}>
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
                      <Typography
                        variant='h6'
                        sx={{ fontSize: '1.1rem', lineHeight: 1 }}
                      >
                        {count}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ textTransform: 'capitalize' }}
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
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel>Log Level</InputLabel>
              <Select
                value={selectedLevel}
                onChange={handleLevelChange}
                label='Log Level'
              >
                {logLevels.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size='small'
              placeholder='Search logs...'
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flex: 1, minWidth: 250 }}
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
            />
          </Stack>

          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            flexWrap='wrap'
          >
            <Tooltip title='Refresh Logs'>
              <IconButton
                onClick={() => refetch()}
                size='small'
                disabled={isLoading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title='Download All Logs'>
              <IconButton onClick={handleDownloadLogs} size='small'>
                <DownloadIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title='Clear All Logs'>
              <IconButton
                onClick={handleClearLogs}
                size='small'
                color='error'
                disabled={isClearing}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              size='small'
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto Refresh {autoRefresh && '(5s)'}
            </Button>

            {(selectedLevel !== 'all' || debouncedSearch) && (
              <Chip
                label={`Filtered: ${
                  selectedLevel !== 'all' ? selectedLevel.toUpperCase() : ''
                }${selectedLevel !== 'all' && debouncedSearch ? ' + ' : ''}${
                  debouncedSearch ? `"${debouncedSearch}"` : ''
                }`}
                onDelete={() => {
                  setSelectedLevel('all');
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                size='small'
                color='primary'
              />
            )}

            {totalCount > 0 && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ ml: 'auto' }}
              >
                {totalCount} total logs
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* Logs Table */}
      <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 600 }}>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>
                Timestamp
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>
                Level
              </TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>
                Module
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
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
                        variant='body2'
                        sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={log.level?.toUpperCase() || 'INFO'}
                        color={getLogColor(log.level)}
                        icon={getLogIcon(log.level)}
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
                      <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                        {log.module || log.source || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant='body2'
                        sx={{
                          fontSize: '0.8rem',
                          wordBreak: 'break-word',
                          fontFamily:
                            log.level?.toLowerCase() === 'error'
                              ? 'monospace'
                              : 'inherit',
                          maxWidth: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {log.message}
                        {log.meta && Object.keys(log.meta).length > 0 && (
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
                        )}
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
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      )}
    </Box>
  );
};

export default LogsViewer;
