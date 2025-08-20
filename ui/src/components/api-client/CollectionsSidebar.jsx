import React from 'react';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Delete as DeleteIcon,
  ExpandLess,
  ExpandMore,
  InsertDriveFile as FileIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';
import CreateCollectionDialog from './CreateCollectionDialog';
import { useDeleteCollectionMutation } from '../../store/api/apiClientApi';

const CollectionsSidebar = ({ collections, onRequestSelect }) => {
  const theme = useTheme();
  const [expandedCollections, setExpandedCollections] = React.useState(new Set());
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [collectionToDelete, setCollectionToDelete] = React.useState(null);
  
  // Use RTK Query mutation for deleting collections
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();

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
    setCreateDialogOpen(true);
  };

  const handleCollectionCreated = (newCollection) => {
    // RTK Query will automatically update the cache, no manual refresh needed
    setCreateDialogOpen(false);
  };

  const handleDeleteCollection = (event, collection) => {
    event.stopPropagation(); // Prevent expanding/collapsing the collection
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;
    
    try {
      // Use RTK Query mutation - this will automatically update the cache
      await deleteCollection(collectionToDelete.id).unwrap();
      
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    } catch (error) {
      // Log error for debugging - consider showing user-friendly notification
      // eslint-disable-next-line no-console
      console.error('Failed to delete collection:', error);
      // You might want to show a toast notification here
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCollectionToDelete(null);
  };

  if (!collections || collections.length === 0) {
    return (
      <>
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

        <CreateCollectionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCollectionCreated={handleCollectionCreated}
        />
      </>
    );
  }

  return (
    <>
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
          {Array.isArray(collections) && collections.map((collection) => (
            <Box key={collection.id}>
              <ListItem
                button
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                  },
                  '&:hover .delete-button': {
                    opacity: 1,
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
                <IconButton
                  className="delete-button"
                  size="small"
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    mr: 1,
                    '&:hover': {
                      color: 'error.main',
                    },
                  }}
                  onClick={(event) => handleDeleteCollection(event, collection)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
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

      <CreateCollectionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCollectionCreated={handleCollectionCreated}
      />

      <Dialog
        aria-describedby="delete-dialog-description"
        aria-labelledby="delete-dialog-title"
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle id="delete-dialog-title">Delete Collection</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete &quot;{collectionToDelete?.name}&quot;? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={handleCancelDelete}>Cancel</Button>
          <Button 
            color="error" 
            disabled={isDeleting}
            variant="contained"
            onClick={handleConfirmDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CollectionsSidebar;
