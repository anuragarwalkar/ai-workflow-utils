import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useFetchProjectCustomFieldsQuery } from '../../../store/api/jiraApi';

const CustomFieldHelper = ({ projectType, issueType = 'Task', onFieldSelect }) => {
  const [showGuide, setShowGuide] = useState(false);

  const {
    data: projectFieldsData,
    isLoading,
    error,
  } = useFetchProjectCustomFieldsQuery(
    { projectKey: projectType, issueType },
    { skip: !projectType }
  );

  const projectFields = projectFieldsData?.data?.fields || {};
  const fieldsList = Object.values(projectFields);

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
  };

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
      <Chip color={typeColors[type] || 'default'} label={type} size='small' variant='outlined' />
    );
  };

  if (!projectType) {
    return (
      <Alert severity='info'>
        <AlertTitle>Custom Field Helper</AlertTitle>
        Please select a project type to see available custom fields.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert severity='info'>
        <AlertTitle>Loading...</AlertTitle>
        Fetching custom fields for project {projectType}...
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity='warning'>
        <AlertTitle>Custom Fields Not Available</AlertTitle>
        Could not fetch custom fields for project {projectType}.
        <Button onClick={() => setShowGuide(true)} size='small' sx={{ mt: 1 }} variant='outlined'>
          Show Guide
        </Button>
      </Alert>
    );
  }

  if (fieldsList.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant='h6'>Custom Fields Helper</Typography>
            <Tooltip title='Show guide on how to find custom field IDs'>
              <IconButton onClick={() => setShowGuide(true)} size='small'>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Alert severity='info' sx={{ mt: 2 }}>
            No custom fields configured for this project and issue type.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant='h6'>Available Custom Fields ({fieldsList.length})</Typography>
            <Tooltip title='Show guide on how to find custom field IDs'>
              <IconButton onClick={() => setShowGuide(true)} size='small'>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
            Custom fields for project &quot;{projectType}&quot; ({issueType}):
          </Typography>

          <Grid container spacing={2}>
            {fieldsList.map(field => (
              <Grid item key={field.id} lg={6} xs={12}>
                <Card sx={{ p: 2 }} variant='outlined'>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 'bold' }} variant='subtitle2'>
                        {field.name}
                      </Typography>
                      <Typography
                        color='primary'
                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                        variant='body2'
                      >
                        {field.id}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        {renderFieldType(field.type)}
                        {field.required && (
                          <Chip color='error' label='Required' size='small' variant='outlined' />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Tooltip title='Copy Field ID'>
                        <IconButton onClick={() => copyToClipboard(field.id)} size='small'>
                          <ContentCopyIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {onFieldSelect && (
                        <Tooltip title='Use this field'>
                          <IconButton onClick={() => onFieldSelect(field)} size='small'>
                            <InfoIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Dialog maxWidth='md' onClose={() => setShowGuide(false)} open={showGuide}>
        <DialogTitle>How to Find Jira Custom Field IDs</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 'bold', mb: 2 }} variant='subtitle1'>
            Method 1: Using Jira UI
          </Typography>
          <ol>
            <li>Go to Jira Settings → Issues → Custom fields</li>
            <li>Find your custom field in the list</li>
            <li>Click on the field name to see its details</li>
            <li>Look for the field ID (format: customfield_XXXXX)</li>
          </ol>

          <Typography sx={{ fontWeight: 'bold', mb: 2, mt: 3 }} variant='subtitle1'>
            Method 2: Using Browser Developer Tools
          </Typography>
          <ol>
            <li>Open any Jira issue edit page</li>
            <li>Right-click on a custom field and select Inspect Element</li>
            <li>Look for HTML attributes containing customfield_</li>
            <li>The ID format is: customfield_XXXXX</li>
          </ol>

          <Alert severity='info' sx={{ mt: 3 }}>
            <AlertTitle>Example</AlertTitle>
            If you see customfield_10006 in Jira admin, use that as your Field Key.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuide(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomFieldHelper;
