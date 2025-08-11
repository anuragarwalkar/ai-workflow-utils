import { Box, TextField } from '@mui/material';

const PRForm = ({ formData, onChange }) => {
  const handleChange = field => event => {
    onChange({
      ...formData,
      [field]: event.target.value,
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        required
        label='Project Key'
        placeholder='Enter project key'
        value={formData.projectKey}
        onChange={handleChange('projectKey')}
      />
      <TextField
        fullWidth
        required
        label='Repository Slug'
        placeholder='Enter repository slug'
        value={formData.repoSlug}
        onChange={handleChange('repoSlug')}
      />
      <TextField
        fullWidth
        required
        label='Branch Name'
        placeholder='Enter branch name'
        value={formData.branchName}
        onChange={handleChange('branchName')}
      />
    </Box>
  );
};

export default PRForm;
