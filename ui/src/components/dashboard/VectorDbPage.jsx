import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Snackbar,
  Alert,
  Slider,
  Grid,
  Divider,
  Checkbox,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  FlashOn as FlashIcon,
  Speed as SpeedIcon,
  AccountTree as SchemaIcon,
  Dataset as DatasetIcon,
  Psychology as AiIcon,
  FilterList as FilterIcon,
  Hub as HubIcon,
  Close as CloseIcon,
  Memory as MemoryIcon,
  Terminal as TerminalIcon,
  Analytics as AnalyticsIcon,
  SelectAll as SelectAllIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  useGetLanceDbStatsQuery,
  useGetLanceDbTableRecordsQuery,
  useGetLanceDbTableSchemaQuery,
  useDeleteLanceDbRecordMutation,
  useDeleteLanceDbRecordsMutation,
  useInsertLanceDbRecordMutation,
  useReindexLanceDbNotesMutation,
  useSearchLanceDbMutation,
  useGetLanceDbDiagnosticsQuery,
} from '../../store/api/dashboardApi';

const VectorDbPage = () => {
  const { isDark } = useAppTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Table Exploration State
  const [selectedTable, setSelectedTable] = useState('summaries');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selection & Bulk Action State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState({
    open: false,
    isAllMatching: false,
  });

  // Playground State
  const [searchQuery, setSearchQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0);
  const [searchResults, setSearchResults] = useState(null);

  // Modals & Inspection
  const [inspectRecord, setInspectRecord] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ text: '', type: 'general', tags: '', summary: '' });

  // Notifications / Feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // API Hooks
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useGetLanceDbStatsQuery(undefined, {
    pollingInterval: 30000,
  });
  const stats = statsData?.data || {};

  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    refetch: refetchRecords,
  } = useGetLanceDbTableRecordsQuery({
    tableName: selectedTable,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: tableSearch.trim() ? tableSearch : undefined,
  });
  const records = recordsData?.data?.records || [];
  const totalRecordsCount = recordsData?.data?.filteredCount ?? recordsData?.data?.totalCount ?? 0;

  const { data: schemaData, isLoading: isSchemaLoading } = useGetLanceDbTableSchemaQuery(selectedTable);
  const schema = schemaData?.data?.fields || [];

  const { data: diagData, isLoading: isDiagLoading, refetch: refetchDiag } = useGetLanceDbDiagnosticsQuery();
  const diagnostics = diagData?.data || {};

  // Mutations
  const [deleteRecord, { isLoading: isDeleting }] = useDeleteLanceDbRecordMutation();
  const [deleteRecords, { isLoading: isDeletingBulk }] = useDeleteLanceDbRecordsMutation();
  const [insertRecord, { isLoading: isInserting }] = useInsertLanceDbRecordMutation();
  const [reindexNotes, { isLoading: isReindexing }] = useReindexLanceDbNotesMutation();
  const [searchLanceDb, { isLoading: isSearching }] = useSearchLanceDbMutation();

  // Selection Logic
  const currentPageRecordIds = records.map((r) => r.id).filter(Boolean);
  const isAllPageSelected =
    currentPageRecordIds.length > 0 &&
    currentPageRecordIds.every((id) => selectedIds.includes(id));
  const isSomePageSelected =
    currentPageRecordIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    if (isAllPageSelected) {
      // Unselect only the records visible on the current page
      setSelectedIds((prev) => prev.filter((id) => !currentPageRecordIds.includes(id)));
    } else {
      // Add all current page record IDs into selection
      const newIds = new Set([...selectedIds, ...currentPageRecordIds]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleSelectAllMatching = () => {
    setBulkConfirmDialog({
      open: true,
      isAllMatching: true,
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    const selectedData = records.filter((r) => selectedIds.includes(r.id));
    const dataToExport = selectedData.length > 0 ? selectedData : records;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lancedb_${selectedTable}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: `Exported ${dataToExport.length} record(s) to JSON`, severity: 'success' });
  };

  // Handlers
  const handleCopy = (text, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    setSnackbar({ open: true, message: label, severity: 'success' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vector record from LanceDB?')) return;
    try {
      await deleteRecord({ tableName: selectedTable, id }).unwrap();
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setSnackbar({ open: true, message: 'Record deleted from LanceDB', severity: 'success' });
      if (inspectRecord?.id === id) setInspectRecord(null);
      refetchStats();
      refetchRecords();
      refetchDiag();
    } catch (err) {
      setSnackbar({ open: true, message: err?.data?.error || 'Failed to delete record', severity: 'error' });
    }
  };

  const handleConfirmBulkDelete = async () => {
    try {
      if (bulkConfirmDialog.isAllMatching) {
        await deleteRecords({
          tableName: selectedTable,
          deleteAll: true,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        }).unwrap();
        setSnackbar({
          open: true,
          message: `All ${typeFilter !== 'all' ? typeFilter + ' ' : ''}records deleted from LanceDB`,
          severity: 'success',
        });
      } else {
        await deleteRecords({
          tableName: selectedTable,
          ids: selectedIds,
        }).unwrap();
        setSnackbar({
          open: true,
          message: `Deleted ${selectedIds.length} vector record(s) from LanceDB`,
          severity: 'success',
        });
      }
      setSelectedIds([]);
      setBulkConfirmDialog({ open: false, isAllMatching: false });
      if (inspectRecord && (bulkConfirmDialog.isAllMatching || selectedIds.includes(inspectRecord.id))) {
        setInspectRecord(null);
      }
      refetchStats();
      refetchRecords();
      refetchDiag();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.data?.error || 'Failed to delete records',
        severity: 'error',
      });
    }
  };

  const handleReindex = async () => {
    try {
      await reindexNotes().unwrap();
      setSnackbar({ open: true, message: 'Successfully re-indexed all notes into LanceDB', severity: 'success' });
      refetchStats();
      refetchRecords();
    } catch (err) {
      setSnackbar({ open: true, message: err?.data?.error || 'Failed to reindex notes', severity: 'error' });
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.text.trim()) {
      setSnackbar({ open: true, message: 'Text content is required', severity: 'warning' });
      return;
    }
    try {
      const tagsArray = addForm.tags
        ? addForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await insertRecord({
        text: addForm.text.trim(),
        type: addForm.type,
        tags: tagsArray,
        summary: addForm.summary.trim(),
      }).unwrap();
      setSnackbar({ open: true, message: 'Vector entry added & indexed in LanceDB', severity: 'success' });
      setIsAddOpen(false);
      setAddForm({ text: '', type: 'general', tags: '', summary: '' });
      refetchStats();
      refetchRecords();
    } catch (err) {
      setSnackbar({ open: true, message: err?.data?.error || 'Failed to insert vector record', severity: 'error' });
    }
  };

  const handlePlaygroundSearch = async (queryToSearch) => {
    const q = queryToSearch || searchQuery;
    if (!q.trim()) return;
    try {
      const response = await searchLanceDb({
        query: q.trim(),
        limit: topK,
        tableName: selectedTable,
      }).unwrap();
      setSearchResults(response.data);
    } catch (err) {
      setSnackbar({ open: true, message: err?.data?.error || 'Semantic search failed', severity: 'error' });
    }
  };

  const bgCard = isDark ? '#1e293b' : '#ffffff';
  const borderSubtle = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          pb: 1,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Chip
              icon={<StorageIcon sx={{ fontSize: '16px !important', color: '#00BFA5' }} />}
              label="LanceDB Vector Store"
              sx={{
                bgcolor: isDark ? 'rgba(0,191,165,0.12)' : 'rgba(0,191,165,0.08)',
                color: '#00BFA5',
                border: '1px solid rgba(0,191,165,0.25)',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            />
            <Chip
              label="Serverless Columnar"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(124, 58, 237, 0.12)' : 'rgba(124, 58, 237, 0.08)',
                color: '#A78BFA',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                Engine Active
              </Typography>
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Vector Database Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5 }}>
            High-performance embedded vector database powering semantic search, RAG retrieval, and AI memory context.
          </Typography>
        </Box>

        {/* Global Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              refetchStats();
              refetchRecords();
              refetchDiag();
            }}
            startIcon={<RefreshIcon sx={{ fontSize: '1rem !important' }} />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              height: 34,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: isDark ? '#cbd5e1' : '#475569',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                borderColor: '#00BFA5',
                color: '#00BFA5',
                bgcolor: isDark ? 'rgba(0,191,165,0.08)' : 'rgba(0,191,165,0.04)',
              },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleReindex}
            disabled={isReindexing}
            startIcon={isReindexing ? <CircularProgress size={13} color="inherit" /> : <SyncIcon sx={{ fontSize: '1rem !important' }} />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.5,
              py: 0.5,
              height: 34,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: isDark ? '#a78bfa' : '#7c3aed',
              borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.25)',
              bgcolor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(124, 58, 237, 0.04)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.1)',
                borderColor: '#7c3aed',
              },
            }}
          >
            {isReindexing ? 'Syncing...' : 'Re-index Notes'}
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={() => setIsAddOpen(true)}
            startIcon={<AddIcon sx={{ fontSize: '1rem !important' }} />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.75,
              py: 0.5,
              height: 34,
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: '#00BFA5',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,191,165,0.3)',
              '&:hover': {
                background: '#00a38c',
                boxShadow: '0 4px 12px rgba(0,191,165,0.4)',
              },
            }}
          >
            Add Vector Entry
          </Button>
        </Box>
      </Box>

      {/* Top 5 Key Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {/* Total Vectors */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Vectors
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(0,191,165,0.1)', color: '#00BFA5' }}>
              <DatasetIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {isStatsLoading ? <CircularProgress size={24} color="inherit" /> : stats.totalRecords ?? 0}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
              ● {stats.tableCount ?? 1} Table ({selectedTable})
            </Typography>
          </Box>
        </Paper>

        {/* Vector Dimension */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vector Dimension
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
              <MemoryIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {stats.embeddingInfo?.dimension || 1536} <Typography component="span" variant="subtitle1" sx={{ color: '#64748b' }}>dim</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Float32 precision vectors
          </Typography>
        </Paper>

        {/* Embedding Model */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Embedding Engine
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
              <AiIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.embeddingInfo?.model ? stats.embeddingInfo.model.split('/').pop() : 'text-embedding-3'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: 500 }}>
            {stats.embeddingInfo?.provider || 'OpenAI Compatible'}
          </Typography>
        </Paper>

        {/* Database Storage */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Storage On Disk
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              <StorageIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {stats.diskSizeFormatted || '256 KB'}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Lance zero-copy format
          </Typography>
        </Paper>

        {/* Metric & Distance */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Distance Metric
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
              <SpeedIcon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Cosine / L2
          </Typography>
          <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 500 }}>
            ⚡ ANN Index & Exact Scan
          </Typography>
        </Paper>
      </Box>

      {/* Main Tabs Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          bgcolor: bgCard,
          border: borderSubtle,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: borderSubtle, px: 2, pt: 1, bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(248,250,252,0.6)' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 48,
                color: isDark ? '#94a3b8' : '#64748b',
                '&.Mui-selected': {
                  color: '#00BFA5',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#00BFA5',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<DatasetIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label={`Records & Data (${totalRecordsCount})`} />
            <Tab icon={<FlashIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Semantic Similarity Playground" />
            <Tab icon={<SchemaIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Schema & Architecture" />
            <Tab icon={<AnalyticsIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Diagnostics & Health" />
          </Tabs>
        </Box>

        {/* TAB 0: Records & Data Explorer */}
        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            {/* Filter & Search Bar */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 2.5,
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
              }}
            >
              {/* Type Filter Chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, mr: 0.5 }}>
                  TYPE:
                </Typography>
                {['all', 'note', 'todo', 'summary', 'knowledge_dump', 'general'].map((t) => (
                  <Chip
                    key={t}
                    label={t === 'all' ? 'All Records' : t}
                    onClick={() => {
                      setTypeFilter(t);
                      setPage(0);
                      setSelectedIds([]);
                    }}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      bgcolor:
                        typeFilter === t
                          ? '#00BFA5'
                          : isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.04)',
                      color: typeFilter === t ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                      border:
                        typeFilter === t
                          ? '1px solid #00BFA5'
                          : isDark
                          ? '1px solid rgba(255,255,255,0.08)'
                          : '1px solid rgba(0,0,0,0.08)',
                      '&:hover': {
                        bgcolor: typeFilter === t ? '#00a38c' : 'rgba(0,191,165,0.1)',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Text Search & Selection quick actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {records.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAllPage}
                    startIcon={<SelectAllIcon sx={{ fontSize: '1rem !important' }} />}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      height: 34,
                      px: 1.5,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: isAllPageSelected ? '#00BFA5' : isDark ? '#cbd5e1' : '#475569',
                      borderColor: isAllPageSelected ? '#00BFA5' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      bgcolor: isAllPageSelected ? (isDark ? 'rgba(0,191,165,0.1)' : 'rgba(0,191,165,0.05)') : 'transparent',
                      '&:hover': { borderColor: '#00BFA5', color: '#00BFA5' },
                    }}
                  >
                    {isAllPageSelected ? 'Deselect Page' : 'Select Page'}
                  </Button>
                )}

                <TextField
                  size="small"
                  placeholder="Search text, ID, or sourceId..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: tableSearch && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setTableSearch('')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: { xs: '100%', sm: 260 },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)',
                      borderRadius: '8px',
                      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Bulk Selection Action Toolbar */}
            {selectedIds.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  px: 2,
                  mb: 2.5,
                  borderRadius: '10px',
                  bgcolor: isDark ? 'rgba(0, 191, 165, 0.08)' : 'rgba(0, 191, 165, 0.05)',
                  border: '1px solid rgba(0, 191, 165, 0.25)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#00BFA5' }} />}
                    label={`${selectedIds.length} of ${totalRecordsCount} selected`}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(0, 191, 165, 0.18)' : 'rgba(0, 191, 165, 0.12)',
                      color: '#00BFA5',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      height: 26,
                    }}
                  />

                  {totalRecordsCount > selectedIds.length && (
                    <Button
                      size="small"
                      onClick={handleSelectAllMatching}
                      startIcon={<SelectAllIcon sx={{ fontSize: '0.95rem !important' }} />}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        py: 0.25,
                        px: 1,
                        color: '#00BFA5',
                        '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.1)' },
                      }}
                    >
                      Select all {totalRecordsCount} records {typeFilter !== 'all' ? `(type: ${typeFilter})` : ''}
                    </Button>
                  )}

                  <Button
                    size="small"
                    onClick={handleClearSelection}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      py: 0.25,
                      px: 1,
                      color: isDark ? '#94a3b8' : '#64748b',
                      '&:hover': { color: isDark ? '#f8fafc' : '#0f172a' },
                    }}
                  >
                    Clear selection
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleExportSelected}
                    startIcon={<DownloadIcon sx={{ fontSize: '0.95rem !important' }} />}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '7px',
                      height: 30,
                      px: 1.25,
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: isDark ? '#cbd5e1' : '#475569',
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                    }}
                  >
                    Export JSON ({selectedIds.length})
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    disabled={isDeletingBulk}
                    onClick={() => setBulkConfirmDialog({ open: true, isAllMatching: false })}
                    startIcon={isDeletingBulk ? <CircularProgress size={13} color="inherit" /> : <DeleteSweepIcon sx={{ fontSize: '0.95rem !important' }} />}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '7px',
                      height: 30,
                      px: 1.25,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: '#EF4444',
                      color: '#ffffff',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                      '&:hover': { background: '#DC2626' },
                    }}
                  >
                    Delete Selected ({selectedIds.length})
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Table */}
            {isRecordsLoading ? (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: '#00BFA5' }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Loading vector records from LanceDB...
                </Typography>
              </Box>
            ) : records.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: 'center',
                  bgcolor: isDark ? 'rgba(15,23,42,0.3)' : 'rgba(241,245,249,0.5)',
                  borderRadius: '12px',
                  border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)',
                }}
              >
                <DatasetIcon sx={{ fontSize: 44, color: '#64748b', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  No vector records found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  {tableSearch ? 'No records match your search filter.' : 'Click "Add Vector Entry" or "Re-index Notes" to populate LanceDB.'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setTypeFilter('all');
                    setTableSearch('');
                    setSelectedIds([]);
                  }}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 1.75,
                    py: 0.5,
                    height: 32,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#00BFA5',
                    borderColor: 'rgba(0,191,165,0.4)',
                    '&:hover': { borderColor: '#00BFA5', bgcolor: 'rgba(0,191,165,0.06)' },
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer
                  sx={{
                    borderRadius: '12px',
                    border: borderSubtle,
                    bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.8)',
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <TableRow>
                        <TableCell padding="checkbox" sx={{ width: 44, pl: 1.5 }}>
                          <Tooltip title={isAllPageSelected ? 'Deselect current page' : 'Select all on current page'}>
                            <Checkbox
                              size="small"
                              checked={isAllPageSelected}
                              indeterminate={isSomePageSelected}
                              onChange={handleSelectAllPage}
                              sx={{
                                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                '&.Mui-checked': { color: '#00BFA5' },
                                '&.MuiCheckbox-indeterminate': { color: '#00BFA5' },
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', width: 90 }}>TYPE</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', width: 140 }}>RECORD ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569' }}>CONTENT PREVIEW</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', width: 160 }}>TAGS</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', width: 190 }}>VECTOR SAMPLE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', width: 100 }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((row) => {
                        const isSelected = selectedIds.includes(row.id);
                        return (
                          <TableRow
                            key={row.id}
                            hover
                            selected={isSelected}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isSelected
                                ? isDark
                                  ? 'rgba(0,191,165,0.08) !important'
                                  : 'rgba(0,191,165,0.04) !important'
                                : undefined,
                              '&:hover': {
                                bgcolor: isSelected
                                  ? isDark
                                    ? 'rgba(0,191,165,0.14) !important'
                                    : 'rgba(0,191,165,0.08) !important'
                                  : isDark
                                  ? 'rgba(255,255,255,0.03)'
                                  : 'rgba(0,0,0,0.02)',
                              },
                            }}
                            onClick={() => setInspectRecord(row)}
                          >
                            {/* Row Checkbox */}
                            <TableCell padding="checkbox" sx={{ pl: 1.5 }} onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(row.id)}
                                sx={{
                                  color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                                  '&.Mui-checked': { color: '#00BFA5' },
                                }}
                              />
                            </TableCell>

                            {/* Type */}
                            <TableCell>
                              <Chip
                                label={row.type || 'note'}
                                size="small"
                                sx={{
                                  textTransform: 'capitalize',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 22,
                                  bgcolor:
                                    row.type === 'note'
                                      ? 'rgba(59,130,246,0.15)'
                                      : row.type === 'summary'
                                      ? 'rgba(139,92,246,0.15)'
                                      : 'rgba(16,185,129,0.15)',
                                  color:
                                    row.type === 'note'
                                      ? '#60A5FA'
                                      : row.type === 'summary'
                                      ? '#A78BFA'
                                      : '#34D399',
                                }}
                              />
                            </TableCell>

                            {/* Record ID */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: isDark ? '#cbd5e1' : '#334155' }}>
                                  {row.id ? `${row.id.substring(0, 8)}...` : 'N/A'}
                                </Typography>
                                <Tooltip title="Copy ID">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(row.id, 'Record ID copied');
                                    }}
                                    sx={{ p: 0.25, color: '#64748b' }}
                                  >
                                    <CopyIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>

                            {/* Content Preview */}
                            <TableCell>
                              <Box sx={{ maxWidth: 450 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isDark ? '#e2e8f0' : '#1e293b',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {row.text || '(empty content)'}
                                </Typography>
                                {row.summary && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#8B5CF6',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      mt: 0.25,
                                    }}
                                  >
                                    ✨ Summary: {row.summary}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>

                            {/* Tags */}
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {row.tags && row.tags.length > 0 ? (
                                  row.tags.map((tg, idx) => (
                                    <Chip
                                      key={idx}
                                      label={tg}
                                      size="small"
                                      sx={{
                                        fontSize: '0.68rem',
                                        height: 20,
                                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        color: isDark ? '#cbd5e1' : '#475569',
                                      }}
                                    />
                                  ))
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    —
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>

                            {/* Vector Sample */}
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Chip
                                    label={`${row.vectorSnippet?.dimensions || 1536}d`}
                                    size="small"
                                    sx={{
                                      fontSize: '0.68rem',
                                      height: 18,
                                      bgcolor: 'rgba(0,191,165,0.12)',
                                      color: '#00BFA5',
                                      fontWeight: 700,
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    norm: {row.vectorSnippet?.norm ?? '1.0'}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.68rem' }}>
                                  [{row.vectorSnippet?.sample?.slice(0, 3).join(', ')}...]
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Inspect Record">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInspectRecord(row);
                                    }}
                                    sx={{ color: '#3B82F6' }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Vector">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(row.id);
                                    }}
                                    sx={{ color: '#EF4444' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalRecordsCount}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    borderTop: borderSubtle,
                    mt: 1,
                  }}
                />
              </>
            )}
          </Box>
        )}

        {/* TAB 1: Semantic Similarity Playground */}
        {activeTab === 1 && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}>
                Interactive Vector Similarity Playground
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Test LanceDB cosine similarity matching in real-time. Embeddings are generated on the fly and compared against all indexed vectors.
              </Typography>
            </Box>

            {/* Query Input Section */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.7)',
                border: borderSubtle,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
                <TextField
                  fullWidth
                  placeholder="Enter natural language query to search vector database (e.g. 'wife work', 'authentication token', 'jira ticket')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePlaygroundSearch();
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#00BFA5' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? '#0f172a' : '#ffffff',
                      borderRadius: '12px',
                      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                      '&:hover fieldset': { borderColor: '#00BFA5' },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handlePlaygroundSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  sx={{
                    background: '#00BFA5',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 2.5,
                    height: 40,
                    borderRadius: '10px',
                    textTransform: 'none',
                    minWidth: 130,
                    boxShadow: '0 2px 8px rgba(0,191,165,0.25)',
                    '&:hover': { background: '#00a38c' },
                  }}
                >
                  {isSearching ? <CircularProgress size={18} color="inherit" /> : 'Vector Search'}
                </Button>
              </Box>

              {/* Suggestions Chips & Sliders */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}>
                {/* Suggestions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    TRY:
                  </Typography>
                  {['wife', 'globant', 'architecture', 'strategy', 'jira ticket'].map((sample) => (
                    <Chip
                      key={sample}
                      label={sample}
                      size="small"
                      onClick={() => {
                        setSearchQuery(sample);
                        handlePlaygroundSearch(sample);
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isDark ? '#cbd5e1' : '#475569',
                        '&:hover': { bgcolor: 'rgba(0,191,165,0.15)', color: '#00BFA5' },
                      }}
                    />
                  ))}
                </Box>

                {/* Top-K Slider */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Top-K ({topK}):
                  </Typography>
                  <Slider
                    size="small"
                    value={topK}
                    min={1}
                    max={20}
                    onChange={(e, val) => setTopK(val)}
                    sx={{ color: '#00BFA5' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Results Section */}
            {isSearching && (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: '#00BFA5' }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Generating vector embedding and scanning LanceDB tables...
                </Typography>
              </Box>
            )}

            {searchResults && !isSearching && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Search Meta Benchmark */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                    Found {searchResults.count} vector matches for "{searchResults.query}"
                  </Typography>
                  <Chip
                    icon={<FlashIcon sx={{ fontSize: '14px !important', color: '#F59E0B' }} />}
                    label={`Execution Latency: ${searchResults.durationMs || 12} ms`}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245,158,11,0.2)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>

                {searchResults.results?.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', bgcolor: isDark ? 'rgba(15,23,42,0.3)' : 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No similar vector records found in the database.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {searchResults.results.map((res, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        sx={{
                          p: 2.25,
                          borderRadius: '14px',
                          bgcolor: isDark ? '#111827' : '#f8fafc',
                          border: borderSubtle,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                          transition: 'transform 0.15s, border-color 0.15s',
                          '&:hover': {
                            borderColor: 'rgba(0,191,165,0.4)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        {/* Header Match Badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`#${idx + 1} Match`}
                              size="small"
                              sx={{
                                bgcolor: idx === 0 ? 'rgba(0,191,165,0.15)' : 'rgba(59,130,246,0.15)',
                                color: idx === 0 ? '#00BFA5' : '#3B82F6',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            />
                            <Chip
                              label={res.type || 'note'}
                              size="small"
                              sx={{
                                textTransform: 'capitalize',
                                fontSize: '0.7rem',
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                color: isDark ? '#cbd5e1' : '#475569',
                              }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                              Distance: {res.distance}
                            </Typography>
                            <Chip
                              label={`${res.similarityScore}% Match`}
                              size="small"
                              sx={{
                                bgcolor:
                                  res.similarityScore >= 75
                                    ? 'rgba(16,185,129,0.15)'
                                    : res.similarityScore >= 50
                                    ? 'rgba(245,158,11,0.15)'
                                    : 'rgba(239,68,68,0.15)',
                                color:
                                  res.similarityScore >= 75
                                    ? '#10B981'
                                    : res.similarityScore >= 50
                                    ? '#F59E0B'
                                    : '#EF4444',
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Content */}
                        <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.6 }}>
                          {res.text}
                        </Typography>

                        {res.summary && (
                          <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 600, display: 'block', mb: 0.25 }}>
                              AI Summary
                            </Typography>
                            <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#334155', fontSize: '0.82rem' }}>
                              {res.summary}
                            </Typography>
                          </Box>
                        )}

                        {/* Footer details */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                            ID: {res.id || 'N/A'} {res.sourceId ? `• Source: ${res.sourceId.substring(0, 8)}...` : ''}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => handleCopy(res.text, 'Content copied')}
                            startIcon={<CopyIcon sx={{ fontSize: 13 }} />}
                            sx={{ textTransform: 'none', color: '#64748b', fontSize: '0.75rem' }}
                          >
                            Copy
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: Schema & Architecture */}
        {activeTab === 2 && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}>
                Lance Columnar Schema ({selectedTable} Table)
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                LanceDB uses Apache Arrow memory layouts with native vector search acceleration, zero-copy reads, and disk-backed streaming.
              </Typography>
            </Box>

            {/* Schema Table */}
            <TableContainer
              sx={{
                borderRadius: '12px',
                border: borderSubtle,
                bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.8)',
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569' }}>FIELD NAME</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569' }}>DATA TYPE (APACHE ARROW)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569' }}>NULLABLE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#475569' }}>ROLE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schema.map((f, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: f.name === 'vector' ? '#00BFA5' : isDark ? '#f1f5f9' : '#0f172a' }}>
                        {f.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#8B5CF6' }}>
                        {f.type}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={f.nullable ? 'Nullable' : 'Required'}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            height: 20,
                            bgcolor: f.nullable ? 'rgba(100,116,139,0.1)' : 'rgba(16,185,129,0.1)',
                            color: f.nullable ? '#64748b' : '#10B981',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.85rem' }}>
                        {f.name === 'vector'
                          ? '1536-dim Embedding representation'
                          : f.name === 'id'
                          ? 'Unique record UUID'
                          : f.name === 'sourceId'
                          ? 'Foreign key reference to Note / Item'
                          : f.name === 'text'
                          ? 'Raw unvectorized content payload'
                          : f.name === 'summary'
                          ? 'AI-generated summarization'
                          : f.name === 'tags'
                          ? 'Categorical metadata list'
                          : 'Metadata attribute'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Architecture Details Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.5)',
                  border: borderSubtle,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00BFA5', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HubIcon fontSize="small" /> Engine Architecture
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <li><strong>Format:</strong> Apache Arrow zero-copy memory mapping.</li>
                  <li><strong>Storage Path:</strong> <code>{stats.dbPath}</code></li>
                  <li><strong>Index Engine:</strong> DiskANN & IVF-PQ vector quantization support.</li>
                  <li><strong>Persistence:</strong> Serverless disk-backed database (no daemon required).</li>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.5)',
                  border: borderSubtle,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8B5CF6', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AiIcon fontSize="small" /> Embeddings Pipeline
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <li><strong>Provider:</strong> {stats.embeddingInfo?.provider}</li>
                  <li><strong>Model:</strong> <code>{stats.embeddingInfo?.model}</code></li>
                  <li><strong>Embedding Dim:</strong> {stats.embeddingInfo?.dimension || 1536} dimensions</li>
                  <li><strong>Base Endpoint:</strong> {stats.embeddingInfo?.baseUrl}</li>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {/* TAB 3: Diagnostics & Health */}
        {activeTab === 3 && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}>
                  LanceDB Health & System Diagnostics
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  Live verification of vector database tables, file system accessibility, schema integrity, and embedding models.
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => refetchDiag()}
                startIcon={<RefreshIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  height: 32,
                  px: 1.5,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#00BFA5',
                  borderColor: 'rgba(0,191,165,0.3)',
                  '&:hover': { borderColor: '#00BFA5', bgcolor: 'rgba(0,191,165,0.06)' },
                }}
              >
                Run Diagnostics
              </Button>
            </Box>

            {isDiagLoading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#00BFA5' }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {diagnostics.checks?.map((chk, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(241,245,249,0.5)',
                      border: borderSubtle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {chk.status === 'PASS' ? (
                        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
                      ) : chk.status === 'WARN' ? (
                        <WarningIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
                      ) : (
                        <WarningIcon sx={{ color: '#EF4444', fontSize: 22 }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          {chk.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          {chk.details}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={chk.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor:
                          chk.status === 'PASS'
                            ? 'rgba(16,185,129,0.15)'
                            : chk.status === 'WARN'
                            ? 'rgba(245,158,11,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        color:
                          chk.status === 'PASS'
                            ? '#10B981'
                            : chk.status === 'WARN'
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    />
                  </Paper>
                ))}
              </Box>
            )}

            {/* Quick Actions Panel */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(0,191,165,0.06)' : 'rgba(0,191,165,0.03)',
                border: '1px solid rgba(0,191,165,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00BFA5' }}>
                  Sync All AI Notes to LanceDB
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                  Forces a full rebuild of vectors for all notes in the database.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={handleReindex}
                disabled={isReindexing}
                startIcon={isReindexing ? <CircularProgress size={14} color="inherit" /> : <SyncIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  background: '#00BFA5',
                  color: '#ffffff',
                  textTransform: 'none',
                  borderRadius: '8px',
                  height: 34,
                  px: 1.75,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,191,165,0.3)',
                  '&:hover': { background: '#00a38c' },
                }}
              >
                {isReindexing ? 'Rebuilding Vectors...' : 'Start Full Sync'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* INSPECT RECORD DIALOG / MODAL */}
      <Dialog
        open={Boolean(inspectRecord)}
        onClose={() => setInspectRecord(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon sx={{ color: '#00BFA5' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Vector Record Inspector
            </Typography>
            <Chip label={inspectRecord?.type || 'note'} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
          </Box>
          <IconButton size="small" onClick={() => setInspectRecord(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {/* ID & Metadata Bar */}
          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.7)', border: borderSubtle }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>RECORD ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{inspectRecord?.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>SOURCE ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{inspectRecord?.sourceId || '(None)'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>TAGS</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {inspectRecord?.tags?.length > 0 ? (
                    inspectRecord.tags.map((tg, i) => <Chip key={i} label={tg} size="small" />)
                  ) : (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>No tags assigned</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Full Content */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Content Payload</Typography>
              <Button
                size="small"
                onClick={() => handleCopy(inspectRecord?.text, 'Content payload copied')}
                startIcon={<CopyIcon sx={{ fontSize: 13 }} />}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#00BFA5' }}
              >
                Copy Content
              </Button>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '10px',
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                border: borderSubtle,
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                color: isDark ? '#e2e8f0' : '#1e293b',
              }}
            >
              {inspectRecord?.text}
            </Paper>
          </Box>

          {/* Vector Embeddings Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MemoryIcon fontSize="small" sx={{ color: '#00BFA5' }} /> Vector Embedding Details
              </Typography>
              <Chip
                label={`${inspectRecord?.vectorSnippet?.dimensions || 1536} Dimensions (Float32)`}
                size="small"
                sx={{ bgcolor: 'rgba(0,191,165,0.12)', color: '#00BFA5', fontWeight: 600 }}
              />
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '10px',
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                border: borderSubtle,
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#8B5CF6',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: '#64748b' }}>
                <span>Sample Vector Slice (first 6 values):</span>
                <span>L2 Norm: {inspectRecord?.vectorSnippet?.norm ?? 1.0}</span>
              </Box>
              [{inspectRecord?.vectorSnippet?.sample?.join(', ')}, ...]
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: borderSubtle, justifyContent: 'space-between' }}>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={() => handleDelete(inspectRecord?.id)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}
          >
            Delete Vector
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setInspectRecord(null)}
            sx={{
              textTransform: 'none',
              background: '#00BFA5',
              color: '#ffffff',
              fontSize: '0.8125rem',
              borderRadius: '8px',
              px: 2,
              '&:hover': { background: '#00a38c' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD VECTOR ENTRY MODAL */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add Vector Document to LanceDB
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Text will be vectorized using the active embedding model and indexed into LanceDB.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            fullWidth
            label="Document / Knowledge Text"
            multiline
            rows={4}
            placeholder="Paste raw notes, documentation, or knowledge insights..."
            value={addForm.text}
            onChange={(e) => setAddForm({ ...addForm, text: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                borderRadius: '10px',
              },
            }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Type"
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                helperText="e.g. note, summary, general, documentation"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#0f172a' : '#f8fafc',
                    borderRadius: '10px',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Tags (comma separated)"
                placeholder="ai, architecture, jira"
                value={addForm.tags}
                onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? '#0f172a' : '#f8fafc',
                    borderRadius: '10px',
                  },
                }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Summary (Optional)"
            placeholder="Short 1-2 sentence synopsis..."
            value={addForm.summary}
            onChange={(e) => setAddForm({ ...addForm, summary: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                borderRadius: '10px',
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: borderSubtle }}>
          <Button
            size="small"
            onClick={() => setIsAddOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontSize: '0.8125rem' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleAddSubmit}
            disabled={isInserting || !addForm.text.trim()}
            sx={{
              textTransform: 'none',
              background: '#00BFA5',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderRadius: '8px',
              px: 2,
              boxShadow: '0 2px 8px rgba(0,191,165,0.25)',
              '&:hover': { background: '#00a38c' },
            }}
          >
            {isInserting ? <CircularProgress size={15} color="inherit" /> : 'Index Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={bulkConfirmDialog.open}
        onClose={() => !isDeletingBulk && setBulkConfirmDialog({ open: false, isAllMatching: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: bgCard,
            border: borderSubtle,
            backgroundImage: 'none',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '10px',
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeleteSweepIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
              {bulkConfirmDialog.isAllMatching
                ? `Delete All ${totalRecordsCount} Records?`
                : `Delete ${selectedIds.length} Selected Record${selectedIds.length > 1 ? 's' : ''}?`}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Table: {selectedTable}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', mb: 2, lineHeight: 1.6 }}>
            {bulkConfirmDialog.isAllMatching ? (
              <>
                You are about to permanently delete <strong>all {totalRecordsCount}</strong> vector records
                {typeFilter !== 'all' ? ` of type "${typeFilter}"` : ''} from LanceDB.
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{selectedIds.length}</strong> selected vector record{selectedIds.length > 1 ? 's' : ''} from LanceDB?
                Their embeddings and content will be permanently removed.
              </>
            )}
          </Typography>

          <Alert severity="warning" sx={{ borderRadius: '10px', fontSize: '0.8rem' }}>
            Vector embeddings and associated metadata will be permanently deleted from the Lance columnar store.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: borderSubtle, gap: 1 }}>
          <Button
            size="small"
            onClick={() => setBulkConfirmDialog({ open: false, isAllMatching: false })}
            disabled={isDeletingBulk}
            sx={{ textTransform: 'none', color: '#64748b', fontSize: '0.8125rem' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={handleConfirmBulkDelete}
            disabled={isDeletingBulk}
            startIcon={isDeletingBulk ? <CircularProgress size={15} color="inherit" /> : <DeleteIcon sx={{ fontSize: '1rem !important' }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderRadius: '8px',
              background: '#EF4444',
              color: '#ffffff',
              px: 2,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
              '&:hover': { background: '#DC2626' },
            }}
          >
            {isDeletingBulk
              ? 'Deleting...'
              : bulkConfirmDialog.isAllMatching
              ? `Delete All (${totalRecordsCount})`
              : `Delete (${selectedIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '10px', fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VectorDbPage;
