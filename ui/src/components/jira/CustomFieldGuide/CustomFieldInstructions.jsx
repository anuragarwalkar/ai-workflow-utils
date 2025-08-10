import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const CustomFieldInstructions = () => (
  <Accordion defaultExpanded sx={{ mb: 3 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="h6">How to Find Custom Field IDs</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ pl: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Method 1: Using Jira UI
        </Typography>
        <ol>
          <li>Go to Jira Settings → Issues → Custom fields</li>
          <li>Find your custom field in the list</li>
          <li>Click on the field name to see its details</li>
          <li>Look for the field ID in the URL or field details (format: customfield_XXXXX)</li>
        </ol>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>
          Method 2: Using Browser Developer Tools
        </Typography>
        <ol>
          <li>Open any Jira issue edit page</li>
          <li>Right-click on a custom field and select "Inspect Element"</li>
          <li>Look for HTML attributes like `id` or `name` containing "customfield_"</li>
          <li>The ID format is: customfield_XXXXX (where XXXXX is a number)</li>
        </ol>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>
          Method 3: Using This Tool
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The custom fields listed below show the actual field IDs you can use in your forms.
        </Typography>
      </Box>
    </AccordionDetails>
  </Accordion>
);

export default CustomFieldInstructions;
