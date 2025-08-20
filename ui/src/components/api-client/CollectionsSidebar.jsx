import React from 'react';
import {
  Box,
  Button,
  Chip,
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
  Folder as FolderClosedIcon,
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

  const getMethodColor = (method) => {
    const colors = {
      GET: '#4CAF50',
      POST: '#FF9800',
      PUT: '#2196F3',
      PATCH: '#9C27B0',
      DELETE: '#F44336',
    };
    return colors[method] || '#757575';
  };

  if (!collections || collections.length === 0) {
    return (
      <>
        <Box sx={{ p: 1.5 }}>
          <Box 
            alignItems="center" 
            display="flex" 
            justifyContent="flex-end" 
            mb={1}
            px={0.5}
          >
            <IconButton size="small" onClick={handleCreateCollection}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box
            sx={{
              border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '8px',
              p: 2.5,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <FolderIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" fontSize="0.875rem">
              No collections yet
            </Typography>
            <Typography display="block" sx={{ mt: 0.5 }} variant="caption" fontSize="0.75rem">
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
      <Box sx={{ p: 1.5 }}>
        <Box 
          alignItems="center" 
          display="flex" 
          justifyContent="flex-end" 
          mb={1}
          px={0.5}
        >
          <IconButton size="small" onClick={handleCreateCollection}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <List dense disablePadding>
          {Array.isArray(collections) && collections.map((collection) => (
            <Box key={collection.id}>
              {/* Collection Header */}
              <ListItem
                button
                disableGutters
                sx={{
                  borderRadius: '6px',
                  mb: 0.25,
                  py: 0.5,
                  px: 1,
                  minHeight: 32,
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.04),
                  },
                  '&:hover .delete-button': {
                    opacity: 1,
                  },
                }}
                onClick={() => toggleCollection(collection.id)}
              >
                {expandedCollections.has(collection.id) ? 
                  <FolderIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} /> : 
                  <FolderClosedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                }
                <ListItemText 
                  primary={collection.name}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    noWrap: true,
                  }}
                  sx={{ my: 0 }}
                />
                <IconButton
                  className="delete-button"
                  size="small"
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    mr: 0.5,
                    p: 0.25,
                    '&:hover': {
                      color: 'error.main',
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                  onClick={(event) => handleDeleteCollection(event, collection)}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
                {expandedCollections.has(collection.id) ? 
                  <ExpandLess sx={{ fontSize: 16 }} /> : 
                  <ExpandMore sx={{ fontSize: 16 }} />
                }
              </ListItem>
              
              {/* Collection Requests */}
              <Collapse in={expandedCollections.has(collection.id)}>
                <List dense disablePadding sx={{ ml: 1.5 }}>
                  {collection.requests?.map((request) => (
                    <ListItem
                      button
                      disableGutters
                      key={request.id}
                      sx={{
                        borderRadius: '4px',
                        py: 0.25,
                        px: 1,
                        minHeight: 28,
                        '&:hover': {
                          background: alpha(theme.palette.secondary.main, 0.08),
                        },
                      }}
                      onClick={() => onRequestSelect(request)}
                    >
                      <FileIcon sx={{ mr: 1, fontSize: 14, color: 'text.disabled' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
                        <Chip
                          label={request.method}
                          size="small"
                          sx={{
                            backgroundColor: getMethodColor(request.method),
                            color: 'white',
                            fontSize: '0.65rem',
                            height: 18,
                            minWidth: 36,
                            '& .MuiChip-label': {
                              px: 0.5,
                              fontWeight: 600,
                            },
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.2,
                            }}
                          >
                            {request.name}
                          </Typography>
                          {request.url && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.65rem',
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.1,
                                mt: 0.25,
                              }}
                            >
                              {request.url}
                            </Typography>
                          )}
                        </Box>
                      </Box>
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
