import { TextField, Box } from '@mui/material';

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
        label='Project Key'
        value={formData.projectKey}
        onChange={handleChange('projectKey')}
        placeholder='Enter project key'
        fullWidth
        required
      />
      <TextField
        label='Repository Slug'
        value={formData.repoSlug}
        onChange={handleChange('repoSlug')}
        placeholder='Enter repository slug'
        fullWidth
        required
      />
      <TextField
        label='Branch Name'
        value={formData.branchName}
        onChange={handleChange('branchName')}
        placeholder='Enter branch name'
        fullWidth
        required
      />
    </Box>
  );
};

export default PRForm;
