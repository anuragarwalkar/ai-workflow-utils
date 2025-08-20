import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, Search as SearchIcon } from '@mui/icons-material';

/**
 * Pure component for URL-based entry
 */
const UrlEntryForm = ({
  urlData,
  isLoading,
  onUrlChange,
  onDirectToPRChange,
  onSubmit,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        required
        disabled={isLoading}
        helperText="Paste the full GitStash URL (repository or pull request)"
        label="GitStash URL"
        placeholder="https://gitstash.company.com/projects/PROJ/repos/my-repository/pull-requests/123"
        rows={2}
        value={urlData.url}
        onChange={onUrlChange}
      />
    </Grid>

    {urlData.parsedData?.isValid === true && (
      <Grid item xs={12}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography sx={{ mb: 1 }} variant="subtitle2">
            ✅ URL Parsed Successfully
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              mb: 1,
            }}
          >
            <Chip
              color="primary"
              label={`Project: ${urlData.parsedData.projectKey}`}
              size="small"
            />
            <Chip
              color="secondary"
              label={`Repo: ${urlData.parsedData.repoSlug}`}
              size="small"
            />
            {Boolean(urlData.parsedData.prNumber) && (
              <Chip
                color="success"
                label={`PR: #${urlData.parsedData.prNumber}`}
                size="small"
              />
            )}
          </Box>
          {Boolean(urlData.parsedData.prNumber) && (
            <FormControlLabel
              control={
                <Switch
                  checked={urlData.directToPR}
                  size="small"
                  onChange={onDirectToPRChange}
                />
              }
              label="Go directly to this PR review"
              sx={{ mt: 1 }}
            />
          )}
        </Alert>
      </Grid>
    )}

    {Boolean(urlData.url) && urlData.parsedData?.isValid === false && (
      <Grid item xs={12}>
        <Alert severity="warning">
          Invalid URL format. Please ensure the URL follows the GitStash format:
          <br />
          <code>https://domain/projects/PROJECT_KEY/repos/REPO_SLUG</code>
          <br />
          or
          <br />
          <code>
            https://domain/projects/PROJECT_KEY/repos/REPO_SLUG/pull-requests/PR_NUMBER
          </code>
        </Alert>
      </Grid>
    )}

    <Grid item xs={12}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button
          disabled={isLoading || !urlData.parsedData?.isValid}
          size="large"
          startIcon={
            urlData.parsedData?.prNumber && urlData.directToPR ? (
              <AutoAwesomeIcon />
            ) : (
              <SearchIcon />
            )
          }
          sx={{
            minWidth: 200,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
            },
          }}
          type="submit"
          variant="contained"
          onClick={onSubmit}
        >
          {isLoading
            ? 'Loading...'
            : urlData.parsedData?.prNumber && urlData.directToPR
              ? 'Go Directly to Review'
              : 'Fetch Pull Requests'}
        </Button>
      </Box>
    </Grid>
  </Grid>
);

export default UrlEntryForm;
