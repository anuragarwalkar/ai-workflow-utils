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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  GetApp as ExportIcon,
  Publish as ImportIcon,
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

const TemplateSettings = () => {
  const dispatch = useDispatch();
  const templates = useSelector(selectFilteredTemplates);
  const searchTerm = useSelector(selectSearchTerm);
  const filterType = useSelector(selectFilterType);
  const showDefaultTemplates = useSelector(selectShowDefaultTemplates);
  const availableTypes = useSelector(selectAvailableIssueTypes);

  const [deleteTemplate] = useDeleteTemplateMutation();
  const [exportTemplates] = useExportTemplatesMutation();
  const [resetToDefaults] = useResetToDefaultsMutation();

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteTemplate(id).unwrap();
      } catch (error) {
        console.error("Failed to delete template:", error);
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
    } catch (error) {
      console.error("Failed to export templates:", error);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all templates to defaults? This will keep your custom templates but restore default settings."
      )
    ) {
      try {
        await resetToDefaults().unwrap();
      } catch (error) {
        console.error("Failed to reset templates:", error);
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
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            size="small"
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => dispatch(openCreateForm())}
          >
            New Template
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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
          </Grid>
          <Grid item xs={12} md={3}>
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
          </Grid>
          <Grid item xs={12} md={5} alignItems="center">
            <FormControlLabel
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
          </Grid>
        </Grid>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
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
                    {template.templateType && (
                      <Chip
                        label={template.templateType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {template.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
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
                          sx={{ mr: 0.5, mb: 0.5, fontSize: "0.7rem" }}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => dispatch(openCreateForm())}
          >
            Create Template
          </Button>
        </Box>
      )}

      {/* Template Form Modal */}
      <TemplateForm />
    </Box>
  );
};

export default TemplateSettings;
