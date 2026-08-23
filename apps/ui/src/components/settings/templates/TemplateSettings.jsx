/* eslint-disable max-lines */
/* eslint-disable react/jsx-max-depth */
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GetApp as ExportIcon,
  FileCopy as FileCopyIcon,
  Refresh as ResetIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  openCreateForm,
  openDuplicateForm,
  openEditForm,
  selectAvailableIssueTypes,
  selectFilterType,
  selectFilteredTemplates,
  selectSearchTerm,
  selectShowDefaultTemplates,
  setFilterType,
  setSearchTerm,
  setShowDefaultTemplates,
} from '../../../store/slices/templateSlice';
import {
  useDeleteTemplateMutation,
  useExportTemplatesMutation,
  useResetToDefaultsMutation,
} from '../../../store/api/templateApi';
import TemplateForm from './TemplateForm';
import { useAppTheme } from '../../../theme/useAppTheme';

const TemplateSettings = () => {
  const dispatch = useDispatch();
  const { isDark } = useAppTheme();
  const templates = useSelector(selectFilteredTemplates);
  const searchTerm = useSelector(selectSearchTerm);
  const filterType = useSelector(selectFilterType);
  const showDefaultTemplates = useSelector(selectShowDefaultTemplates);
  const availableTypes = useSelector(selectAvailableIssueTypes);

  const [deleteTemplate] = useDeleteTemplateMutation();
  const [exportTemplates] = useExportTemplatesMutation();
  const [resetToDefaults] = useResetToDefaultsMutation();

  // Helper function to render template chips
  const renderTemplateChips = template => {
    const chips = [];

    if (template.templateType) {
      chips.push({
        key: 'templateType',
        label: template.templateType,
        color: 'primary',
      });
    }

    if (template.type) {
      chips.push({
        key: 'type',
        label: template.type,
        color: 'info',
      });
    }

    if (template.isDefault) {
      chips.push({
        key: 'default',
        label: 'Default',
        color: 'secondary',
      });
    }

    return chips.map(chip => (
      <Chip
        color={chip.color}
        key={chip.key}
        label={chip.label}
        size='small'
        sx={{
          borderColor: isDark ? `rgba(102, 126, 234, 0.4)` : undefined,
          color: isDark ? `rgba(102, 126, 234, 0.9)` : undefined,
          backgroundColor: isDark ? `rgba(102, 126, 234, 0.1)` : undefined,
        }}
        variant='outlined'
      />
    ));
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteTemplate(id).unwrap();
      } catch (error) {
        // Error handling is now done in Redux API layer
        console.error('Delete template error:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportTemplates().unwrap();
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Success message is now handled in Redux API layer
    } catch (error) {
      // Error handling is now done in Redux API layer
      console.error('Export templates error:', error);
    }
  };
  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset all templates to defaults? This will keep your custom templates but restore default settings.'
      )
    ) {
      try {
        await resetToDefaults().unwrap();
        // Success message is now handled in Redux API layer
      } catch (error) {
        // Error handling is now done in Redux API layer
        console.error('Reset templates error:', error);
      }
    }
  };

  return (
    <Box>
      {/* Header Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography component='h2' variant='h6'>
          Template Management
        </Typography>
        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            startIcon={<ExportIcon />}
            sx={{
              borderColor: isDark ? 'rgba(102, 126, 234, 0.5)' : 'primary.main',
              color: isDark ? 'rgba(102, 126, 234, 0.9)' : 'primary.main',
              '&:hover': {
                borderColor: isDark ? 'rgba(102, 126, 234, 0.8)' : 'primary.dark',
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.04)',
              },
            }}
            variant='outlined'
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            size='small'
            startIcon={<ResetIcon />}
            sx={{
              borderColor: isDark ? 'rgba(102, 126, 234, 0.5)' : 'primary.main',
              color: isDark ? 'rgba(102, 126, 234, 0.9)' : 'primary.main',
              '&:hover': {
                borderColor: isDark ? 'rgba(102, 126, 234, 0.8)' : 'primary.dark',
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.04)',
              },
            }}
            variant='outlined'
            onClick={handleReset}
          >
            Reset
          </Button>
          <Tooltip title='Template filtering feature is currently not available'>
            <span>
              <Button
                disabled
                startIcon={<AddIcon />}
                sx={{
                  background: isDark
                    ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                    : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)'
                      : 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  },
                }}
                variant='contained'
                onClick={() => dispatch(openCreateForm())}
              >
                New Template
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item md={4} xs={12}>
            <Tooltip title='Template filtering feature is currently not available'>
              <TextField
                disabled
                fullWidth
                select
                label='Filter by Type'
                SelectProps={{ native: true }}
                size='small'
                value={filterType}
                onChange={e => dispatch(setFilterType(e.target.value))}
              >
                <option value='all'>All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          <Grid item md={3} xs={12}>
            <Tooltip title='Template filtering feature is currently not available'>
              <TextField
                disabled
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder='Search templates...'
                size='small'
                style={{ marginBottom: '0' }}
                value={searchTerm}
                onChange={e => dispatch(setSearchTerm(e.target.value))}
              />
            </Tooltip>
          </Grid>
          <Grid item alignItems='center' md={5} xs={12}>
            <Tooltip title='Template filtering feature is currently not available'>
              <span>
                <FormControlLabel
                  disabled
                  control={
                    <Switch
                      checked={showDefaultTemplates}
                      onChange={e => dispatch(setShowDefaultTemplates(e.target.checked))}
                    />
                  }
                  label='Show default templates'
                />
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={2}>
        {templates.map(template => (
          <Grid item key={template.id} lg={4} md={6} xs={12}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: isDark ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(102, 126, 234, 0.2)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography component='h3' sx={{ fontWeight: 600 }} variant='h6'>
                    {template.name}
                  </Typography>
                  <Stack direction='row' spacing={0.5}>
                    {renderTemplateChips(template)}
                  </Stack>
                </Box>

                <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
                  {template.content.substring(0, 150)}...
                </Typography>

                {template.variables && template.variables.length > 0 ? (
                  <Box>
                    <Typography color='text.secondary' variant='caption'>
                      Variables:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {template.variables.map(variable => (
                        <Chip
                          key={variable}
                          label={`{${variable}}`}
                          size='small'
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            fontSize: '0.7rem',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                          variant='outlined'
                        />
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton
                    size='small'
                    title='Edit'
                    onClick={() => dispatch(openEditForm(template))}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size='small'
                    title='Duplicate'
                    onClick={() => dispatch(openDuplicateForm(template))}
                  >
                    <FileCopyIcon />
                  </IconButton>
                </Box>

                <IconButton
                  color='error'
                  size='small'
                  title='Delete'
                  onClick={() => handleDelete(template.id, template.name)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {templates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography gutterBottom color='text.secondary' variant='h6'>
            No templates found
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first template to get started'}
          </Typography>
          <Tooltip title='Template filtering feature is currently not available'>
            <span>
              <Button
                disabled
                startIcon={<AddIcon />}
                variant='contained'
                onClick={() => dispatch(openCreateForm())}
              >
                Create Template
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Template Form Modal */}
      <TemplateForm />
    </Box>
  );
};

export default TemplateSettings;
