import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
  useFetchAllCustomFieldsQuery,
  useFetchCustomFieldValuesQuery,
} from '../../../store/api/jiraApi';

// Helper function to copy field ID to clipboard
const copyToClipboard = text => {
  navigator.clipboard.writeText(text);
};

// Helper function to render field type chip
const renderFieldType = type => {
  const typeColors = {
    string: 'primary',
    number: 'secondary',
    option: 'warning',
    array: 'info',
    date: 'success',
    unknown: 'default',
  };

  return (
    <Chip
      color={typeColors[type] || 'default'}
      label={type || 'unknown'}
      size='small'
      variant='outlined'
    />
  );
};

// Helper component for loading state
const LoadingState = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
);

// Helper component for error state
const ErrorState = ({ error }) => (
  <Alert severity='error'>
    Error loading custom fields: {error?.message || 'Unknown error'}
  </Alert>
);

// Helper component for instructions accordion
const InstructionsAccordion = () => (
  <Accordion defaultExpanded sx={{ mb: 3 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant='h6'>How to Find Custom Field IDs</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ pl: 2 }}>
        <Typography sx={{ fontWeight: 'bold', mb: 2 }} variant='subtitle1'>
          Method 1: Using Jira UI
        </Typography>
        <ul>
          <li>Go to Jira Settings → Issues → Custom Fields</li>
          <li>Find your custom field in the list</li>
          <li>
            Look for the field ID in the URL or field details (format:
            customfield_XXXXX)
          </li>
        </ul>

        <Typography
          sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
          variant='subtitle1'
        >
          Method 2: Browser Inspect
        </Typography>
        <ul>
          <li>Open a Jira issue that contains the custom field</li>
          <li>
            Right-click on a custom field and select &ldquo;Inspect
            Element&rdquo;
          </li>
          <li>
            Look for HTML attributes like `id` or `name` containing
            &ldquo;customfield_&rdquo;
          </li>
          <li>The ID format is: customfield_XXXXX (where XXXXX is a number)</li>
        </ul>

        <Typography
          sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
          variant='subtitle1'
        >
          Method 3: Use the fields list below
        </Typography>
        <Typography color='text.secondary' variant='body2'>
          Browse through all available custom fields in your Jira instance
          below.
        </Typography>
      </Box>
    </AccordionDetails>
  </Accordion>
);

// Helper component to render field values
const FieldValues = ({ valuesData, valuesLoading, fieldId }) => {
  if (valuesLoading) return <CircularProgress size={20} />;

  // Access the issues from the correct path
  const issues = valuesData?.data?.issues;

  if (!issues?.length) {
    return (
      <Typography color='text.secondary' variant='body2'>
        No issues found in this project
      </Typography>
    );
  }

  // Extract all field values (including duplicates) to show raw data
  const fieldValues = [];
  issues.forEach(issue => {
    const fieldValue = issue.fields?.[fieldId];
    if (fieldValue !== null && fieldValue !== undefined) {
      fieldValues.push({
        issueKey: issue.key,
        value: fieldValue,
      });
    }
  });

  if (fieldValues.length === 0) {
    return (
      <Typography color='text.secondary' variant='body2'>
        No values found for field {fieldId} in {issues.length} issues
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        color='text.secondary'
        sx={{ mb: 1, display: 'block' }}
        variant='caption'
      >
        Found {fieldValues.length} values from {issues.length} issues (showing
        all raw JSON):
      </Typography>
      {fieldValues.map((item, index) => (
        <Box
          key={`${item.issueKey}-${index}`}
          sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}
        >
          <Typography
            color='primary'
            sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}
            variant='caption'
          >
            Issue: {item.issueKey}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: 'white',
              p: 1,
              borderRadius: 0.5,
              border: '1px solid #ddd',
            }}
            variant='body2'
          >
            {JSON.stringify(item.value, null, 2)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Helper component for field card content
const FieldCardContent = ({
  field,
  showValues,
  projectKey,
  valuesData,
  valuesLoading,
}) => (
  <Box sx={{ flexGrow: 1 }}>
    <Typography sx={{ fontWeight: 'bold', mb: 1 }} variant='h6'>
      {field.name || 'Unnamed Field'}
    </Typography>
    <Typography
      sx={{ fontFamily: 'monospace', fontSize: '0.875rem', mb: 1 }}
      variant='body2'
    >
      {field.id}
    </Typography>
    <Box sx={{ mt: 1 }}>{renderFieldType(field.type)}</Box>

    {/* Show values if requested */}
    {Boolean(showValues && projectKey) && (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }} variant='subtitle2'>
          Sample Values from {projectKey}:
        </Typography>
        <FieldValues
          fieldId={field.id}
          valuesData={valuesData}
          valuesLoading={valuesLoading}
        />
      </Box>
    )}
  </Box>
);

// Helper component for field card actions
const FieldCardActions = ({ field, projectKey, showValues, setShowValues }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Button
      size='small'
      startIcon={<ContentCopyIcon />}
      variant='outlined'
      onClick={() => copyToClipboard(field.id)}
    >
      Copy ID
    </Button>
    {Boolean(projectKey) && (
      <Button
        size='small'
        startIcon={<VisibilityIcon />}
        variant='outlined'
        onClick={() => setShowValues(!showValues)}
      >
        {showValues ? 'Hide' : 'Show'} Values
      </Button>
    )}
  </Box>
);

// Helper component for field card with optional values
const FieldCard = ({ field, projectKey }) => {
  const [showValues, setShowValues] = useState(false);

  const { data: valuesData, isLoading: valuesLoading } =
    useFetchCustomFieldValuesQuery(
      {
        fieldId: field.id,
        projectKey,
        maxResults: 10,
      },
      { skip: !showValues || !projectKey }
    );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <FieldCardContent
            field={field}
            projectKey={projectKey}
            showValues={showValues}
            valuesData={valuesData}
            valuesLoading={valuesLoading}
          />
          <FieldCardActions
            field={field}
            projectKey={projectKey}
            setShowValues={setShowValues}
            showValues={showValues}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper component for search and field list
const FieldListSection = ({
  searchTerm,
  setSearchTerm,
  filteredFields,
  projectKey,
}) => (
  <>
    <TextField
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      label='Search custom fields...'
      sx={{ mb: 3 }}
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />

    <Typography sx={{ fontWeight: 'bold', mb: 2 }} variant='h6'>
      Available Custom Fields ({filteredFields.length})
    </Typography>

    {filteredFields.length === 0 ? (
      <Typography color='text.secondary' variant='body2'>
        No custom fields found matching your search.
      </Typography>
    ) : (
      filteredFields.map(field => (
        <FieldCard field={field} key={field.id} projectKey={projectKey} />
      ))
    )}
  </>
);

// Helper component for quick start guide
const QuickStartGuide = () => (
  <Alert severity='info' sx={{ mt: 3 }}>
    <AlertTitle>Quick Start</AlertTitle>
    <Typography variant='body2'>
      1. Find your custom field ID using the methods above
      <br />
      2. Copy the field ID (format: customfield_XXXXX)
      <br />
      3. Add it to your Jira form with the appropriate value
      <br />
      4. Refer to the field type to understand what values are accepted
    </Typography>
  </Alert>
);

const CustomFieldGuide = ({ _projectKey, _issueType = 'Task' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Get project key from Redux state with fallback priority
  const selectedProject = useSelector(state => state.pr?.selectedProject);
  const jiraProjectType = useSelector(
    state => state.jira?.createJira?.projectType
  );

  const defaultProjectKey =
    _projectKey || selectedProject?.projectKey || jiraProjectType || '';

  const [projectKey, setProjectKey] = useState(defaultProjectKey);

  const {
    data: allFieldsData,
    isLoading: isLoadingAll,
    error: allFieldsError,
  } = useFetchAllCustomFieldsQuery();

  const allFields = allFieldsData?.data || [];

  const filteredFields = allFields.filter(field => {
    const matchesSearch =
      !searchTerm ||
      field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (isLoadingAll) return <LoadingState />;
  if (allFieldsError) return <ErrorState error={allFieldsError} />;

  return (
    <Box>
      <InstructionsAccordion />
      <TextField
        fullWidth
        helperText={`Enter a project key to view actual field values (e.g., PROJ)${
          selectedProject?.projectKey
            ? ` • Auto-filled from selected project: ${selectedProject.projectKey}`
            : jiraProjectType
              ? ` • Auto-filled from Jira form: ${jiraProjectType}`
              : ''
        }`}
        label='Project Key (Optional)'
        sx={{ mb: 3 }}
        value={projectKey}
        onChange={e => setProjectKey(e.target.value.toUpperCase())}
      />
      <FieldListSection
        filteredFields={filteredFields}
        projectKey={projectKey}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <QuickStartGuide />
    </Box>
  );
};

export default CustomFieldGuide;
