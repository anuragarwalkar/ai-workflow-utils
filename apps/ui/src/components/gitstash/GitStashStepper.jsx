import React from 'react';
import { Paper, Step, StepLabel, Stepper } from '@mui/material';

const steps = ['Select Repository', 'Choose Pull Request', 'Review Changes'];

const GitStashStepper = ({ activeStep }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Stepper alternativeLabel activeStep={activeStep}>
      {steps.map(label => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  </Paper>
);

export default GitStashStepper;
