import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Public as GlobalIcon } from '@mui/icons-material';
import EnvironmentApiService from '../../services/environmentApiService';

const EnvironmentSelector = ({
  activeEnvironment,
  onEnvironmentChange,
  showVariables = false,
  compact = false,
}) => {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const response = await EnvironmentApiService.getEnvironments();
      setEnvironments(response.data || []);
    } catch (error) {
      console.error('Failed to load environments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvironmentChange = async event => {
    const selectedId = event.target.value;
    const selectedEnv = environments.find(env => env.id === selectedId);

    if (selectedEnv) {
      try {
        await EnvironmentApiService.setActiveEnvironment(selectedId);
        onEnvironmentChange(selectedEnv);
      } catch (error) {
        console.error('Failed to set active environment:', error);
      }
    }
  };

  if (compact) {
    return (
      <FormControl size='small' sx={{ minWidth: 150 }}>
        <InputLabel>Environment</InputLabel>
        <Select
          disabled={loading}
          label='Environment'
          value={activeEnvironment?.id || ''}
          onChange={handleEnvironmentChange}
        >
          <MenuItem value=''>
            <em>No Environment</em>
          </MenuItem>
          {environments.map(env => (
            <MenuItem key={env.id} value={env.id}>
              <Box alignItems='center' display='flex'>
                <GlobalIcon sx={{ mr: 1, fontSize: 16 }} />
                {env.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>Active Environment</InputLabel>
        <Select
          disabled={loading}
          label='Active Environment'
          value={activeEnvironment?.id || ''}
          onChange={handleEnvironmentChange}
        >
          <MenuItem value=''>
            <em>No Environment Selected</em>
          </MenuItem>
          {environments.map(env => (
            <MenuItem key={env.id} value={env.id}>
              <Box alignItems='center' display='flex' justifyContent='space-between' width='100%'>
                <Box alignItems='center' display='flex'>
                  <GlobalIcon sx={{ mr: 1 }} />
                  <Typography>{env.name}</Typography>
                </Box>
                <Chip
                  label={`${Object.keys(env.variables || {}).length} vars`}
                  size='small'
                  variant='outlined'
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showVariables && activeEnvironment ? <Box mt={2}>
          <Typography gutterBottom variant='subtitle2'>
            Environment Variables:
          </Typography>
          <Box display='flex' flexWrap='wrap' gap={1}>
            {Object.entries(activeEnvironment.variables || {}).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${String(value).substring(0, 20)}${String(value).length > 20 ? '...' : ''}`}
                size='small'
                sx={{ fontSize: '0.75rem' }}
                variant='outlined'
              />
            ))}
          </Box>
        </Box> : null}
    </Box>
  );
};

// Variable autocomplete component for input fields
export const VariableAutocomplete = ({
  value,
  onChange,
  activeEnvironment,
  environments = [],
  label = 'Value',
  placeholder = 'Enter value or {{variable_name}}',
  ...textFieldProps
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // Get all variable suggestions from all environments
    const allSuggestions = EnvironmentApiService.getVariableSuggestions(environments);
    setSuggestions(allSuggestions);
  }, [environments]);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    onChange(newInputValue);
  };

  // Filter suggestions based on input
  const getFilteredSuggestions = () => {
    const cursorPosition = inputValue.length;
    const beforeCursor = inputValue.substring(0, cursorPosition);
    const match = beforeCursor.match(/\{\{([^}]*)$/);

    if (match) {
      const [_, partialVar] = match;
      return suggestions
        .filter(suggestion => suggestion.toLowerCase().includes(partialVar.toLowerCase()))
        .map(suggestion => `{{${suggestion}}}`);
    }

    return [];
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <Autocomplete
      freeSolo
      options={filteredSuggestions}
      renderInput={params => (
        <TextField
          {...params}
          {...textFieldProps}
          helperText={
            activeEnvironment
              ? `Active environment: ${activeEnvironment.name}`
              : 'No environment selected'
          }
          label={label}
          placeholder={placeholder}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Box alignItems='center' display='flex'>
            <Typography sx={{ fontFamily: 'monospace' }} variant='body2'>
              {option}
            </Typography>
          </Box>
        </li>
      )}
      value={inputValue}
      onInputChange={handleInputChange}
    />
  );
};

export default EnvironmentSelector;
