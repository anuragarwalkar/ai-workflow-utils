import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { PREVIEW_MODES } from '../../../constants/pr.js';
import DescriptionEditor from './DescriptionEditor.jsx';
import TitleEditor from './TitleEditor.jsx';
import {
  AIGeneratedText,
  CreateButton,
  InfoText,
  PreviewContainer,
  PreviewForm,
  PreviewInfo,
  PreviewTitle,
} from './PreviewSection.style.js';

/**
 * Preview Info Component - Shows branch and AI generation info
 * @param {object} props - Component props
 * @param {object} props.preview - Preview data
 * @returns {JSX.Element} PreviewInfo component
 */
const PreviewInfoComponent = ({ preview }) => (
  <PreviewInfo>
    <InfoText>
      Branch: {preview?.branchName}
    </InfoText>
    {Boolean(preview?.aiGenerated) && (
      <AIGeneratedText>
        AI-Generated Content (Streamed)
      </AIGeneratedText>
    )}
  </PreviewInfo>
);

/**
 * Preview Form Component - Editable form for title and description
 * @param {object} props - Component props
 * @param {string} props.editableTitle - Editable title
 * @param {function} props.setEditableTitle - Title setter
 * @param {string} props.editableDescription - Editable description
 * @param {function} props.setEditableDescription - Description setter
 * @param {string} props.descriptionMode - Description editor mode
 * @param {function} props.setDescriptionMode - Description mode setter
 * @param {object} props.preview - Preview data
 * @returns {JSX.Element} PreviewForm component
 */
const PreviewFormComponent = ({
  editableTitle,
  setEditableTitle,
  editableDescription,
  setEditableDescription,
  descriptionMode,
  setDescriptionMode,
  preview,
}) => (
  <PreviewForm>
    <TitleEditor title={editableTitle} onChange={setEditableTitle} />
    <DescriptionEditor
      description={editableDescription}
      mode={descriptionMode}
      onChange={setEditableDescription}
      onModeChange={setDescriptionMode}
    />
    <PreviewInfoComponent preview={preview} />
  </PreviewForm>
);

/**
 * Hook for managing preview state
 * @param {object} preview - Preview data
 * @returns {object} Preview state handlers
 */
const usePreviewState = preview => {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState(PREVIEW_MODES.VIEW);

  useEffect(() => {
    if (preview) {
      setEditableTitle(preview.prTitle || '');
      setEditableDescription(preview.prDescription || '');
    }
  }, [preview]);

  return {
    editableTitle,
    setEditableTitle,
    editableDescription,
    setEditableDescription,
    descriptionMode,
    setDescriptionMode,
  };
};

/**
 * Main PreviewSection component
 * @param {object} props - Component props
 * @param {object} props.preview - Preview data
 * @param {function} props.onConfirm - Confirm handler
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} PreviewSection component
 */
const PreviewSection = ({ preview, onConfirm, isLoading }) => {
  const previewState = usePreviewState(preview);

  const handleConfirm = () => {
    onConfirm({
      ...preview,
      prTitle: previewState.editableTitle,
      prDescription: previewState.editableDescription,
    });
  };

  const isDisabled = isLoading || !previewState.editableTitle || !previewState.editableDescription;

  return (
    <PreviewContainer>
      <PreviewTitle variant='h6'>
        Preview
      </PreviewTitle>
      <PreviewFormComponent {...previewState} preview={preview} />
      <CreateButton 
        color='primary' 
        disabled={isDisabled} 
        variant='contained' 
        onClick={handleConfirm}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Create Pull Request'}
      </CreateButton>
    </PreviewContainer>
  );
};

export default PreviewSection;
