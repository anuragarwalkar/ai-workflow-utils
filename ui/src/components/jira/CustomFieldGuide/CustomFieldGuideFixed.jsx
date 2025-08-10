import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { 
  useFetchAllCustomFieldsQuery,
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
        <Typography 
          sx={{ fontWeight: 'bold', mb: 2 }}
          variant='subtitle1'
        >
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
            Right-click on a custom field and select &ldquo;Inspect Element&rdquo;
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
          Browse through all available custom fields in your Jira instance below.
        </Typography>
      </Box>
    </AccordionDetails>
  </Accordion>
);

// Helper component for field card
const FieldCard = ({ field }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
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
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Button
            size='small'
            startIcon={<ContentCopyIcon />}
            variant='outlined'
            onClick={() => copyToClipboard(field.id)}
          >
            Copy ID
          </Button>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Helper component for search and field list
const FieldListSection = ({ searchTerm, setSearchTerm, filteredFields }) => (
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
      filteredFields.map(field => <FieldCard field={field} key={field.id} />)
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

  if (isLoadingAll) {
    return <LoadingState />;
  }

  if (allFieldsError) {
    return <ErrorState error={allFieldsError} />;
  }

  return (
    <Box>
      <InstructionsAccordion />
      <FieldListSection 
        filteredFields={filteredFields}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <QuickStartGuide />
    </Box>
  );
};

export default CustomFieldGuide;
