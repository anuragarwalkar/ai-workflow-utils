import React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  InsertDriveFile as FileIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';

const CollectionsSidebar = ({ collections, onRequestSelect }) => {
  const theme = useTheme();
  const [expandedCollections, setExpandedCollections] = React.useState(new Set());

  const toggleCollection = (collectionId) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleCreateCollection = () => {
    // TODO: Implement collection creation
    console.log('Create new collection');
  };

  if (!collections || collections.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Box 
          alignItems="center" 
          display="flex" 
          justifyContent="space-between" 
          mb={2}
        >
          <Typography variant="h6">Collections</Typography>
          <IconButton size="small" onClick={handleCreateCollection}>
            <AddIcon />
          </IconButton>
        </Box>
        
        <Box
          sx={{
            border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '12px',
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <FolderIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            No collections yet
          </Typography>
          <Typography display="block" sx={{ mt: 1 }} variant="caption">
            Create your first collection to organize requests
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box 
        alignItems="center" 
        display="flex" 
        justifyContent="space-between" 
        mb={2}
      >
        <Typography variant="h6">Collections</Typography>
        <IconButton size="small" onClick={handleCreateCollection}>
          <AddIcon />
        </IconButton>
      </Box>
      
      <List dense>
        {collections.map((collection) => (
          <Box key={collection.id}>
            <ListItem
              button
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                },
              }}
              onClick={() => toggleCollection(collection.id)}
            >
              <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
              <ListItemText 
                primary={collection.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 600,
                }}
              />
              {expandedCollections.has(collection.id) ? 
                <ExpandLess /> : 
                <ExpandMore />
              }
            </ListItem>
            
            <Collapse in={expandedCollections.has(collection.id)}>
              <List dense sx={{ pl: 2 }}>
                {collection.requests?.map((request) => (
                  <ListItem
                    button
                    key={request.id}
                    sx={{
                      borderRadius: '6px',
                      py: 0.5,
                      '&:hover': {
                        background: alpha(theme.palette.secondary.main, 0.1),
                      },
                    }}
                    onClick={() => onRequestSelect(request)}
                  >
                    <FileIcon sx={{ mr: 1, fontSize: 16 }} />
                    <ListItemText
                      primary={request.name}
                      primaryTypographyProps={{
                        variant: 'caption',
                        fontWeight: 500,
                      }}
                      secondary={`${request.method} ${request.url}`}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        sx: { fontSize: '0.7rem' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default CollectionsSidebar;
