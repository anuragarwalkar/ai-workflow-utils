import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';

const CustomFieldItem = ({ field, onUpdateCustomField, onRemoveCustomField }) => (
  <Stack alignItems='center' direction='row' key={field.id} mb={1} spacing={1}>
    <TextField
      label='Field Name'
      size='small'
      value={field.name}
      onChange={e => onUpdateCustomField(field.id, { name: e.target.value })}
    />
    <TextField
      label='Field Value'
      size='small'
      value={field.value}
      onChange={e => onUpdateCustomField(field.id, { value: e.target.value })}
    />
    <IconButton
      aria-label='Remove custom field'
      size='small'
      onClick={() => onRemoveCustomField(field.id)}
    >
      <DeleteIcon fontSize='small' />
    </IconButton>
  </Stack>
);

const CustomFieldsSection = ({
  customFields,
  onAddCustomField,
  onRemoveCustomField,
  onUpdateCustomField,
  onOpenGuide,
}) => (
  <Box>
    <Stack alignItems='center' direction='row' mb={1} spacing={1}>
      <Typography variant='h6'>Custom Fields</Typography>
      <Tooltip title='Learn more about custom fields'>
        <IconButton size='small' onClick={onOpenGuide}>
          <InfoIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Stack>
    {customFields.map(field => (
      <CustomFieldItem
        key={field.id}
        field={field}
        onRemoveCustomField={onRemoveCustomField}
        onUpdateCustomField={onUpdateCustomField}
      />
    ))}
    <Button size='small' startIcon={<AddIcon />} variant='outlined' onClick={onAddCustomField}>
      Add Custom Field
    </Button>
  </Box>
);

export default CustomFieldsSection;
