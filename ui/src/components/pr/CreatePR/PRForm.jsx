import { TextField } from '@mui/material';
import { FORM_FIELDS } from '../../../constants/pr.js';
import { FormContainer } from './PRForm.style.js';
import ScreenshotAttachment from './ScreenshotAttachment.jsx';

/**
 * Pure presentational component for PR form fields and attachments
 * @param {object} props - Component props
 * @param {object} props.formData - Form data object
 * @param {function} props.onChange - Change handler function
 * @param {Array} props.attachedImages - Array of attached image objects
 * @param {function} props.onAddImages - Callback to add images
 * @param {function} props.onRemoveImage - Callback to remove image by id
 * @param {boolean} props.disabled - Whether form is disabled
 * @returns {JSX.Element} PRForm component
 */
const PRForm = ({
  formData,
  onChange,
  attachedImages = [],
  onAddImages,
  onRemoveImage,
  disabled = false,
}) => {
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
      <ScreenshotAttachment
        attachedImages={attachedImages}
        disabled={disabled}
        onAddImages={onAddImages}
        onRemoveImage={onRemoveImage}
      />
    </FormContainer>
  );
};

export default PRForm;

