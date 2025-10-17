import React from 'react';
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';

const JobActionButtons = ({
  job,
  jobId,
  enabled,
  status,
  onToggle,
  onTrigger,
  onEdit,
  onDelete,
}) => (
  <Box alignItems='center' display='flex' justifyContent='space-between'>
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          size='small'
          onChange={() => onToggle(jobId)}
        />
      }
      label='Enabled'
    />

    <Box display='flex' gap={0.5}>
      <Tooltip title='Trigger Now'>
        <span>
          <IconButton
            disabled={!enabled || status === 'running'}
            size='small'
            onClick={() => onTrigger(jobId)}
          >
            <PlayIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title='View Logs'>
        <IconButton size='small'>
          <HistoryIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title='Edit'>
        <IconButton size='small' onClick={() => onEdit(job)}>
          <EditIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title='Delete'>
        <IconButton size='small' onClick={() => onDelete(jobId)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  </Box>
);

export default JobActionButtons;
