import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import CronJobDialog from './CronJobDialog';

const ReviewBuildStep = ({ buildConfig, isStartingBuild, onBack, onStartBuild }) => {
  const [createCronJob, setCreateCronJob] = useState(false);

  const handleCreateCronChange = (event) => {
    setCreateCronJob(event.target.checked);
  };

  const handleScheduleCreated = () => {
    setCreateCronJob(false);
  };

  // If user selected to create cron job, show the dialog instead of review
  if (createCronJob) {
    return (
      <Box>
        <CronJobDialog
          open
          buildConfig={buildConfig}
          editingJob={null}
          onClose={() => setCreateCronJob(false)}
          onScheduleCreated={handleScheduleCreated}
        />
      </Box>
    );
  }

  // Default review configuration view
  return (
    <Box>
      <Typography gutterBottom variant='h6'>
        Review Build Configuration
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Repository Key:
            </Typography>
            <Typography sx={{ mb: 2 }} variant='body1'>
              {buildConfig.repoKey || 'Not specified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Repository Slug:
            </Typography>
            <Typography sx={{ mb: 2 }} variant='body1'>
              {buildConfig.repoSlug || 'Not specified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Git Repositories:
            </Typography>
            <Typography sx={{ mb: 2 }} variant='body1'>
              {buildConfig.gitRepos || 'Not specified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Ticket Number:
            </Typography>
            <Typography sx={{ mb: 2 }} variant='body1'>
              {buildConfig.ticketNumber || 'Not specified'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Selected Packages ({buildConfig.selectedPackages.length}):
            </Typography>
            {buildConfig.selectedPackages.length > 0 ? (
              <Box sx={{ mt: 1 }}>
                {buildConfig.selectedPackages.map(pkg => (
                  <Typography key={pkg} sx={{ ml: 2 }} variant='body2'>
                    • {pkg}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography color='text.secondary' variant='body2'>
                No packages selected
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Build Script:
            </Typography>
            <Typography variant='body1'>
              {buildConfig.buildScript
                ? buildConfig.buildScript.name
                : 'Default script (release_build.sh)'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color='text.secondary' variant='subtitle2'>
              Create Pull Request:
            </Typography>
            <Typography variant='body1'>
              {buildConfig.createPullRequest ? 'Yes' : 'No'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={createCronJob}
              onChange={handleCreateCronChange}
            />
          }
          label='Schedule this build as cron instead'
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button onClick={onBack}>Back</Button>
        <Button
          disabled={isStartingBuild || !buildConfig.ticketNumber}
          variant='contained'
          onClick={onStartBuild}
        >
          {isStartingBuild ? 'Starting...' : 'Start Build'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewBuildStep;
