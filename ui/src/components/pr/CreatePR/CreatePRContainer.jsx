import { CircularProgress } from '@mui/material';
import ErrorBoundary from '../../common/ErrorBoundary.jsx';
import { ERROR_MESSAGES, FORM_FIELDS, SUCCESS_MESSAGES } from '../../../constants/pr.js';
import { usePRForm } from '../../../hooks/usePRForm.js';
import { usePRPreview } from '../../../hooks/usePRPreview.js';
import ToastService from '../../../services/toastService.js';
import { useCreatePullRequestMutation } from '../../../store/api/prApi.js';
import { createLogger } from '../../../utils/log.js';
import { validateRequiredFields } from '../../../utils/validation.js';
import {
  ActionContainer,
  ContentPaper,
  MainContainer,
  PreviewButton,
  Title,
} from './CreatePRContainer.style.js';
import PRForm from './PRForm.jsx';
import PreviewSection from './PreviewSection.jsx';

const logger = createLogger('CreatePRContainer');

/**
 * Container component for Create PR functionality
 * Handles state management and business logic coordination
 * @returns {JSX.Element} CreatePRContent component
 */
const CreatePRContent = () => {
  const {
    formData,
    handleFieldChange,
    resetBranchName,
    saveCurrentConfig,
    isFormValid,
  } = usePRForm();

  const {
    preview,
    showPreview,
    isPreviewLoading,
    generatePreview,
    resetPreview,
  } = usePRPreview();

  const [createPR, { isLoading: isCreating }] = useCreatePullRequestMutation();

  /**
   * Handle form field changes
   * @param {string} field - Field name
   * @param {string} value - New value
   */
  const handleFormChange = (field, value) => {
    logger.debug('handleFormChange', `Field changed: ${field}`, { field, value });
    handleFieldChange(field, value);
    
    // Reset preview when form changes
    if (showPreview) {
      resetPreview();
    }
  };

  /**
   * Handle preview generation
   */
  const handlePreview = async () => {
    logger.info('handlePreview', 'Starting preview generation');
    
    // Validate form before generating preview
    const validation = validateRequiredFields(formData, [
      FORM_FIELDS.PROJECT_KEY,
      FORM_FIELDS.REPO_SLUG,
      FORM_FIELDS.BRANCH_NAME,
    ]);

    if (!validation.isValid) {
      logger.warn('handlePreview', 'Form validation failed', validation.errors);
      ToastService.error(ERROR_MESSAGES.VALIDATION_FAILED);
      return;
    }

    await generatePreview(
      formData,
      (_previewData) => {
        logger.info('handlePreview', SUCCESS_MESSAGES.PREVIEW_GENERATED);
        saveCurrentConfig();
      },
      (error) => {
        logger.error('handlePreview', ERROR_MESSAGES.PREVIEW_FAILED, error);
        ToastService.handleApiError(error, ERROR_MESSAGES.PREVIEW_FAILED);
      }
    );
  };

  /**
   * Handle PR creation
   * @param {object} editedPreview - Edited preview data
   */
  const handleCreate = async (editedPreview) => {
    logger.info('handleCreate', 'Creating pull request');
    
    try {
      const response = await createPR({
        branchName: formData[FORM_FIELDS.BRANCH_NAME],
        projectKey: formData[FORM_FIELDS.PROJECT_KEY],
        repoSlug: formData[FORM_FIELDS.REPO_SLUG],
        customTitle: editedPreview.prTitle,
        customDescription: editedPreview.prDescription,
      }).unwrap();

      // Handle success
      const successMessage = response.pullRequestUrl
        ? `${response.message} - View: ${response.pullRequestUrl}`
        : response.message || SUCCESS_MESSAGES.PR_CREATED;

      ToastService.success(successMessage);
      logger.info('handleCreate', 'Pull request created successfully', response);

      // Reset form and preview
      resetBranchName();
      resetPreview();
    } catch (error) {
      logger.error('handleCreate', ERROR_MESSAGES.CREATE_FAILED, error);
      ToastService.handleApiError(error, ERROR_MESSAGES.CREATE_FAILED);
    }
  };

  const isPreviewDisabled = isPreviewLoading || isCreating || !isFormValid();

  return (
    <MainContainer>
      <ContentPaper>
        <Title variant='h6'>
          Create Pull Request
        </Title>

        <PRForm 
          disabled={isPreviewLoading || isCreating}
          formData={formData} 
          onChange={handleFormChange}
        />

        <ActionContainer>
          <PreviewButton
            disabled={isPreviewDisabled}
            variant='contained'
            onClick={handlePreview}
          >
            {isPreviewLoading ? <CircularProgress size={24} /> : 'Preview'}
          </PreviewButton>
        </ActionContainer>

        {Boolean(showPreview && preview) && (
          <PreviewSection 
            isLoading={isCreating} 
            preview={preview} 
            onConfirm={handleCreate} 
          />
        )}
      </ContentPaper>
    </MainContainer>
  );
};
/**
 * Main component wrapped with error boundary
 * @returns {JSX.Element} CreatePRContainer with error boundary
 */
const CreatePRContainer = () => (
  <ErrorBoundary friendlyMessage="There was an error with the Pull Request creation form. Please refresh the page and try again.">
    <CreatePRContent />
  </ErrorBoundary>
);

export default CreatePRContainer;
