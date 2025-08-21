import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  Code as CodeIcon,
  Info as InfoIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

/**
 * Pure component for help and documentation
 */
const HelpSection = () => (
  <Card elevation={2} sx={{ height: 'fit-content' }}>
    <CardContent>
      <Typography
        sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        variant="h6"
      >
        <InfoIcon color="primary" />
        How to Find Your Repository Details
      </Typography>

      <List dense>
        <ListItem>
          <ListItemIcon>
            <LinkIcon color="action" />
          </ListItemIcon>
          <ListItemText
            primary="Navigate to your GitStash repository"
            secondary="Go to your GitStash instance and open the repository you want to review"
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <CodeIcon color="action" />
          </ListItemIcon>
          <ListItemText
            primary="Extract from URL"
            secondary="URL format: https://gitstash.company.com/projects/[PROJECT_KEY]/repos/[REPO_SLUG]"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography sx={{ mb: 1, fontWeight: 600 }} variant="subtitle2">
        Example:
      </Typography>
      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }} variant="outlined">
        <Box
          sx={{
            fontFamily: 'monospace',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
            URL: https://gitstash.company.com/projects/
          </Typography>
          <Chip color="primary" label="PROJ" size="small" />
          <Typography component="span" sx={{ fontFamily: 'monospace' }} variant="body2">
            /repos/
          </Typography>
          <Chip color="secondary" label="my-repository" size="small" />
        </Box>
        <Typography color="text.secondary" variant="caption">
          Project Key: PROJ | Repository Slug: my-repository
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Your repository details will be saved locally for future use.
        </Typography>
      </Alert>
    </CardContent>
  </Card>
);

export default HelpSection;
