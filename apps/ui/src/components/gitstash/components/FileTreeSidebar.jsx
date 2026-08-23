import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Collapse,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import {
  SidebarContainer,
  SearchHeader,
  FileListContainer,
  FileItemButton,
  FolderItemButton,
  FileText
} from './FileTreeSidebar.style';

const FileTreeSidebar = ({ diffData, selectedFileIndex, onSelectFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Process files to build a tree structure
  const fileTree = useMemo(() => {
    if (!diffData?.diffs) return [];

    const root = [];
    const folders = {};

    diffData.diffs.forEach((file, index) => {
      const filePath = file.destination?.toString || file.source?.toString || 'Unknown file';
      
      // Check if file matches search
      if (searchTerm && !filePath.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }

      // Determine status and stats
      let status = 'MODIFIED';
      if (!file.source && file.destination) status = 'ADDED';
      if (file.source && !file.destination) status = 'REMOVED';

      let additions = 0;
      let deletions = 0;
      file.hunks?.forEach(hunk => {
        hunk.segments?.forEach(segment => {
          if (segment.type === 'ADDED') additions += segment.lines?.length || 0;
          if (segment.type === 'REMOVED') deletions += segment.lines?.length || 0;
        });
      });

      const fileNode = {
        name: filePath.split('/').pop(),
        path: filePath,
        index,
        status,
        additions,
        deletions,
        isFile: true,
      };

      const parts = filePath.split('/');
      
      if (parts.length === 1) {
        root.push(fileNode);
      } else {
        let currentPath = '';
        let currentLevel = folders;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          currentPath += (currentPath ? '/' : '') + part;
          
          if (!currentLevel[part]) {
            currentLevel[part] = {
              name: part,
              path: currentPath,
              isFile: false,
              children: [],
              subfolders: {}
            };
            
            if (i === 0) {
              root.push(currentLevel[part]);
            } else {
              const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
              // Find parent to add to its children
              const addFolderToParent = (foldersObj) => {
                for (const key in foldersObj) {
                   if (foldersObj[key].path === parentPath) {
                       foldersObj[key].children.push(currentLevel[part]);
                       return true;
                   }
                   if (addFolderToParent(foldersObj[key].subfolders)) return true;
                }
                return false;
              };
              addFolderToParent(folders);
            }
          }
          currentLevel = currentLevel[part].subfolders;
        }

        // Add file to its immediate parent
        const parentFolder = parts[parts.length - 2];
        const addFileToFolder = (foldersObj) => {
            for (const key in foldersObj) {
                if (foldersObj[key].name === parentFolder && foldersObj[key].path === filePath.substring(0, filePath.lastIndexOf('/'))) {
                    foldersObj[key].children.push(fileNode);
                    return true;
                }
                if (addFileToFolder(foldersObj[key].subfolders)) return true;
            }
            return false;
        };
        addFileToFolder(folders);
      }
    });

    // Auto-expand all folders when searching
    if (searchTerm) {
        const expandAll = (nodes) => {
            const result = {};
            nodes.forEach(node => {
                if (!node.isFile) {
                    result[node.path] = true;
                    Object.assign(result, expandAll(node.children));
                }
            });
            return result;
        };
        setExpandedFolders(expandAll(root));
    } else if (Object.keys(expandedFolders).length === 0 && root.length > 0) {
        // Initially expand all folders
        const expandAll = (nodes) => {
            const result = {};
            nodes.forEach(node => {
                if (!node.isFile) {
                    result[node.path] = true;
                    Object.assign(result, expandAll(node.children));
                }
            });
            return result;
        };
        setExpandedFolders(expandAll(root));
    }

    return root;
  }, [diffData, searchTerm]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderTree = (nodes, level = 0) => {
    // Sort: folders first, then files alphabetically
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });

    return sortedNodes.map(node => {
      if (node.isFile) {
        return (
          <FileItemButton 
            key={node.path} 
            level={level}
            active={selectedFileIndex === node.index}
            onClick={() => onSelectFile(node.index)}
          >
            <FileIcon sx={{ mr: 1, fontSize: 16, color: getStatusColor(node.status) }} />
            <FileText>{node.name}</FileText>
            {node.status === 'ADDED' && <Chip label="A" size="small" color="success" sx={{ height: 16, minWidth: 16, fontSize: '0.65rem' }} />}
            {node.status === 'REMOVED' && <Chip label="R" size="small" color="error" sx={{ height: 16, minWidth: 16, fontSize: '0.65rem' }} />}
            {node.status === 'MODIFIED' && <Chip label="M" size="small" color="warning" sx={{ height: 16, minWidth: 16, fontSize: '0.65rem' }} />}
          </FileItemButton>
        );
      }

      const isExpanded = expandedFolders[node.path];

      return (
        <Box key={node.path}>
          <FolderItemButton level={level} onClick={() => toggleFolder(node.path)}>
            {isExpanded ? <ExpandMoreIcon sx={{ mr: 0.5, fontSize: 16 }} /> : <ChevronRightIcon sx={{ mr: 0.5, fontSize: 16 }} />}
            {isExpanded ? <FolderOpenIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} /> : <FolderIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />}
            <FileText>{node.name}</FileText>
          </FolderItemButton>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box>
              {renderTree(node.children, level + 1)}
            </Box>
          </Collapse>
        </Box>
      );
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ADDED': return 'success.main';
      case 'REMOVED': return 'error.main';
      case 'MODIFIED': return 'warning.main';
      default: return 'text.secondary';
    }
  };

  return (
    <SidebarContainer>
      <SearchHeader>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </SearchHeader>
      <FileListContainer>
        {renderTree(fileTree)}
      </FileListContainer>
    </SidebarContainer>
  );
};

export default FileTreeSidebar;
