import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  GetApp as ExportIcon,
  Refresh as ResetIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFilteredTemplates,
  selectSearchTerm,
  selectFilterType,
  selectShowDefaultTemplates,
  selectAvailableIssueTypes,
  setSearchTerm,
  setFilterType,
  setShowDefaultTemplates,
  openCreateForm,
  openEditForm,
  openDuplicateForm,
} from "../../../store/slices/templateSlice";
import {
  useDeleteTemplateMutation,
  useExportTemplatesMutation,
  useResetToDefaultsMutation,
} from "../../../store/api/templateApi";
import TemplateForm from "./TemplateForm";
import { useAppTheme } from "../../../theme/useAppTheme";

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
  const renderTemplateChips = (template) => {
    const chips = [];
    
    if (template.templateType) {
      chips.push({
        key: 'templateType',
        label: template.templateType,
        color: 'primary'
      });
    }
    
    if (template.type) {
      chips.push({
        key: 'type',
        label: template.type,
        color: 'info'
      });
    }
    
    if (template.isDefault) {
      chips.push({
        key: 'default',
        label: 'Default',
        color: 'secondary'
      });
    }
    
    return chips.map((chip) => (
      <Chip
        key={chip.key}
        label={chip.label}
        size="small"
        color={chip.color}
        variant="outlined"
        sx={{
          borderColor: isDark 
            ? `rgba(102, 126, 234, 0.4)`
            : undefined,
          color: isDark 
            ? `rgba(102, 126, 234, 0.9)`
            : undefined,
          backgroundColor: isDark 
            ? `rgba(102, 126, 234, 0.1)`
            : undefined,
        }}
      />
    ));
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteTemplate(id).unwrap();
      } catch (error) {
        // Error handling is now done in Redux API layer
        console.error("Delete template error:", error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportTemplates().unwrap();
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `templates-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Success message is now handled in Redux API layer
    } catch (error) {
      // Error handling is now done in Redux API layer
      console.error("Export templates error:", error);
    }
  };  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all templates to defaults? This will keep your custom templates but restore default settings."
      )
    ) {
      try {
        await resetToDefaults().unwrap();
        // Success message is now handled in Redux API layer
      } catch (error) {
        // Error handling is now done in Redux API layer
        console.error("Reset templates error:", error);
      }
    }
  };

  return (
    <Box>
      {/* Header Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" component="h2">
          Template Management
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            size="small"
            sx={{
              borderColor: isDark ? 'rgba(102, 126, 234, 0.5)' : 'primary.main',
              color: isDark ? 'rgba(102, 126, 234, 0.9)' : 'primary.main',
              '&:hover': {
                borderColor: isDark ? 'rgba(102, 126, 234, 0.8)' : 'primary.dark',
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.04)',
              }
            }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            size="small"
            sx={{
              borderColor: isDark ? 'rgba(102, 126, 234, 0.5)' : 'primary.main',
              color: isDark ? 'rgba(102, 126, 234, 0.9)' : 'primary.main',
              '&:hover': {
                borderColor: isDark ? 'rgba(102, 126, 234, 0.8)' : 'primary.dark',
                backgroundColor: isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.04)',
              }
            }}
          >
            Reset
          </Button>
          <Tooltip title="Template filtering feature is currently not available">
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => dispatch(openCreateForm())}
                disabled
                sx={{
                  background: isDark 
                    ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                    : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: isDark 
                      ? 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)'
                      : 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  }
                }}
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
          <Grid item xs={12} md={4}>
            <Tooltip title="Template filtering feature is currently not available">
              <TextField
                disabled
                fullWidth
                select
                size="small"
                label="Filter by Type"
                value={filterType}
                onChange={(e) => dispatch(setFilterType(e.target.value))}
                SelectProps={{ native: true }}
              >
                <option value="all">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={3}>
            <Tooltip title="Template filtering feature is currently not available">
              <TextField
                disabled
                fullWidth
                size="small"
                placeholder="Search templates..."
                style={{ marginBottom: "0" }}
                value={searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12} md={5} alignItems="center">
            <Tooltip title="Template filtering feature is currently not available">
              <span>
                <FormControlLabel
                  disabled
                  control={
                    <Switch
                      checked={showDefaultTemplates}
                      onChange={(e) =>
                        dispatch(setShowDefaultTemplates(e.target.checked))
                      }
                    />
                  }
                  label="Show default templates"
                />
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card
              sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                backgroundColor: isDark 
                  ? 'rgba(45, 55, 72, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
                border: isDark 
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: isDark 
                    ? 'rgba(45, 55, 72, 0.9)'
                    : 'rgba(255, 255, 255, 0.95)',
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    {template.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {renderTemplateChips(template)}
                  </Stack>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {template.content.substring(0, 150)}...
                </Typography>

                {template.variables && template.variables.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Variables:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {template.variables.map((variable) => (
                        <Chip
                          key={variable}
                          label={`{${variable}}`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            mr: 0.5, 
                            mb: 0.5, 
                            fontSize: "0.7rem",
                            borderColor: isDark 
                              ? 'rgba(255, 255, 255, 0.3)'
                              : 'rgba(0, 0, 0, 0.3)',
                            color: isDark 
                              ? 'rgba(255, 255, 255, 0.8)'
                              : 'rgba(0, 0, 0, 0.7)',
                            backgroundColor: isDark 
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.02)',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>

              <CardActions
                sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
              >
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(openEditForm(template))}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(openDuplicateForm(template))}
                    title="Duplicate"
                  >
                    <FileCopyIcon />
                  </IconButton>
                </Box>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(template.id, template.name)}
                  title="Delete"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {templates.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Create your first template to get started"}
          </Typography>
          <Tooltip title="Template filtering feature is currently not available">
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => dispatch(openCreateForm())}
                disabled
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
