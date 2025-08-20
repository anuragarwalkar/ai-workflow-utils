import { TextField } from '@mui/material';
import { FORM_FIELDS } from '../../../constants/pr.js';
import { FormContainer } from './PRForm.style.js';

/**
 * Pure presentational component for PR form fields
 * @param {object} props - Component props
 * @param {object} props.formData - Form data object
 * @param {function} props.onChange - Change handler function
 * @param {boolean} props.disabled - Whether form is disabled
 * @returns {JSX.Element} PRForm component
 */
const PRForm = ({ formData, onChange, disabled = false }) => {
  const handleChange = field => event => {
    onChange(field, event.target.value);
  };

  return (
    <FormContainer>
      <TextField
        fullWidth
        required
        disabled={disabled}
        label='Project Key'
        placeholder='Enter project key'
        value={formData[FORM_FIELDS.PROJECT_KEY]}
        onChange={handleChange(FORM_FIELDS.PROJECT_KEY)}
      />
      <TextField
        fullWidth
        required
        disabled={disabled}
        label='Repository Slug'
        placeholder='Enter repository slug'
        value={formData[FORM_FIELDS.REPO_SLUG]}
        onChange={handleChange(FORM_FIELDS.REPO_SLUG)}
      />
      <TextField
        fullWidth
        required
        disabled={disabled}
        label='Branch Name'
        placeholder='Enter branch name'
        value={formData[FORM_FIELDS.BRANCH_NAME]}
        onChange={handleChange(FORM_FIELDS.BRANCH_NAME)}
      />
    </FormContainer>
  );
};

export default PRForm;
