import { Box, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';

const ProjectTypeSelect = ({ projectType, onProjectTypeChange }) => (
  <FormControl fullWidth>
    <InputLabel id='project-type-label'>Project Type</InputLabel>
    <Select
      label='Project Type'
      labelId='project-type-label'
      value={projectType}
      onChange={onProjectTypeChange}
    >
      <MenuItem value='software'>Software</MenuItem>
      <MenuItem value='business'>Business</MenuItem>
      <MenuItem value='service_desk'>Service Desk</MenuItem>
    </Select>
  </FormControl>
);

const IssueTypeSelect = ({ issueType, onIssueTypeChange }) => (
  <FormControl fullWidth>
    <InputLabel id='issue-type-label'>Issue Type</InputLabel>
    <Select
      label='Issue Type'
      labelId='issue-type-label'
      value={issueType}
      onChange={onIssueTypeChange}
    >
      <MenuItem value='bug'>Bug</MenuItem>
      <MenuItem value='task'>Task</MenuItem>
      <MenuItem value='story'>Story</MenuItem>
    </Select>
  </FormControl>
);

const PrioritySelect = ({ priority, onPriorityChange }) => (
  <FormControl fullWidth>
    <InputLabel id='priority-label'>Priority</InputLabel>
    <Select label='Priority' labelId='priority-label' value={priority} onChange={onPriorityChange}>
      <MenuItem value='highest'>Highest</MenuItem>
      <MenuItem value='high'>High</MenuItem>
      <MenuItem value='medium'>Medium</MenuItem>
      <MenuItem value='low'>Low</MenuItem>
      <MenuItem value='lowest'>Lowest</MenuItem>
    </Select>
  </FormControl>
);

const ConfigurationSection = ({
  issueType,
  onIssueTypeChange,
  priority,
  onPriorityChange,
  projectType,
  onProjectTypeChange,
}) => (
  <Box mb={2}>
    <Stack direction='row' spacing={2}>
      <ProjectTypeSelect projectType={projectType} onProjectTypeChange={onProjectTypeChange} />
      <IssueTypeSelect issueType={issueType} onIssueTypeChange={onIssueTypeChange} />
      <PrioritySelect priority={priority} onPriorityChange={onPriorityChange} />
    </Stack>
  </Box>
);

export default ConfigurationSection;
