import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Collapse,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  DeleteOutline as DeleteIcon,
  East as EastIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  SidebarContainer,
  SearchHeader,
  FileListContainer,
  FileItemButton,
  FolderItemButton,
  StatusBadge,
  FileText,
  FolderText,
} from './FileTreeSidebar.style';

const FileTreeSidebar = ({ diffData, selectedFileIndex, onSelectFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});

  // 1. Process files and determine statuses
  const processedFiles = useMemo(() => {
    if (!diffData?.diffs) return [];

    return diffData.diffs
      .map((file, index) => {
        const sourcePath = file.source?.toString;
        const destPath = file.destination?.toString;
        const filePath = destPath || sourcePath || 'Unknown file';

        let status = 'MODIFIED';
        if (!sourcePath && destPath) status = 'ADDED';
        if (sourcePath && !destPath) status = 'REMOVED';
        if (sourcePath && destPath && sourcePath !== destPath) status = 'RENAMED';

        let additions = 0;
        let deletions = 0;
        file.hunks?.forEach((hunk) => {
          hunk.segments?.forEach((segment) => {
            if (segment.type === 'ADDED') additions += segment.lines?.length || 0;
            if (segment.type === 'REMOVED') deletions += segment.lines?.length || 0;
          });
        });

        return {
          name: filePath.split('/').pop(),
          path: filePath,
          index,
          status,
          additions,
          deletions,
          isFile: true,
        };
      })
      .filter((file) => {
        if (!searchTerm) return true;
        return file.path.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [diffData, searchTerm]);

  // 2. Build hierarchical tree with GitStash-style folder compaction (path squashing)
  const fileTree = useMemo(() => {
    if (processedFiles.length === 0) return [];

    // Step A: Build raw uncompacted tree
    const root = { name: '', path: '', isFile: false, children: [] };

    processedFiles.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const currentPath = parts.slice(0, i + 1).join('/');
        let folderNode = current.children.find((c) => !c.isFile && c.name === part);
        if (!folderNode) {
          folderNode = {
            name: part,
            path: currentPath,
            isFile: false,
            children: [],
          };
          current.children.push(folderNode);
        }
        current = folderNode;
      }

      current.children.push({
        ...file,
        name: parts[parts.length - 1],
        isFile: true,
      });
    });

    // Step B: Compact single-child folder chains (e.g. shared -> hooks => shared/hooks)
    const compactNodes = (nodes) => {
      return nodes.map((node) => {
        if (node.isFile) return node;

        // Recursively compact children first
        let compactedChildren = compactNodes(node.children);

        let currentNode = {
          ...node,
          children: compactedChildren,
        };

        // While currentNode has exactly 1 child and that child is a folder (0 files): squash them!
        while (
          currentNode.children.length === 1 &&
          !currentNode.children[0].isFile
        ) {
          const singleChild = currentNode.children[0];
          currentNode = {
            name: `${currentNode.name}/${singleChild.name}`,
            path: singleChild.path,
            isFile: false,
            children: singleChild.children,
          };
        }

        return currentNode;
      });
    };

    return compactNodes(root.children);
  }, [processedFiles]);

  // Expand all folders by default or when searching
  useEffect(() => {
    if (fileTree.length > 0) {
      const getAllFolderPaths = (nodes) => {
        const result = {};
        nodes.forEach((node) => {
          if (!node.isFile) {
            result[node.path] = true;
            if (node.children) {
              Object.assign(result, getAllFolderPaths(node.children));
            }
          }
        });
        return result;
      };
      setExpandedFolders((prev) => ({
        ...getAllFolderPaths(fileTree),
        ...prev,
      }));
    }
  }, [fileTree]);

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleExpandAll = () => {
    const getAllFolderPaths = (nodes) => {
      const result = {};
      nodes.forEach((node) => {
        if (!node.isFile) {
          result[node.path] = true;
          if (node.children) {
            Object.assign(result, getAllFolderPaths(node.children));
          }
        }
      });
      return result;
    };
    setExpandedFolders(getAllFolderPaths(fileTree));
  };

  const handleCollapseAll = () => {
    setExpandedFolders({});
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ADDED':
        return (
          <StatusBadge status="ADDED" title="Added">
            <DescriptionIcon fontSize="inherit" />
          </StatusBadge>
        );
      case 'REMOVED':
        return (
          <StatusBadge status="REMOVED" title="Removed">
            <DeleteIcon fontSize="inherit" />
          </StatusBadge>
        );
      case 'RENAMED':
      case 'COPIED':
        return (
          <StatusBadge status="RENAMED" title="Renamed / Moved">
            <EastIcon fontSize="inherit" />
          </StatusBadge>
        );
      case 'MODIFIED':
      default:
        return (
          <StatusBadge status="MODIFIED" title="Modified">
            <EditIcon fontSize="inherit" />
          </StatusBadge>
        );
    }
  };

  const renderTree = (nodes, level = 0) => {
    // Sort: folders first alphabetically, then files alphabetically
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });

    return sortedNodes.map((node) => {
      if (node.isFile) {
        return (
          <FileItemButton
            key={node.path}
            level={level}
            active={selectedFileIndex === node.index}
            onClick={() => onSelectFile(node.index)}
          >
            {renderStatusBadge(node.status)}
            <FileText title={node.name}>{node.name}</FileText>
          </FileItemButton>
        );
      }

      const isExpanded = expandedFolders[node.path] !== false;

      return (
        <Box key={node.path}>
          <FolderItemButton level={level} onClick={() => toggleFolder(node.path)}>
            {isExpanded ? (
              <ExpandMoreIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <ChevronRightIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
            )}
            {isExpanded ? (
              <FolderOpenIcon sx={{ mr: 1, fontSize: 16, color: '#5e6c84' }} />
            ) : (
              <FolderIcon sx={{ mr: 1, fontSize: 16, color: '#5e6c84' }} />
            )}
            <FolderText title={node.name}>{node.name}</FolderText>
          </FolderItemButton>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box>{renderTree(node.children, level + 1)}</Box>
          </Collapse>
        </Box>
      );
    });
  };

  const totalFiles = diffData?.diffs?.length || 0;

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
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              height: 32,
              fontSize: '0.8125rem',
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {searchTerm
              ? `${processedFiles.length} of ${totalFiles} files`
              : `${totalFiles} file${totalFiles === 1 ? '' : 's'}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Expand all">
              <IconButton size="small" onClick={handleExpandAll} sx={{ p: 0.25 }}>
                <UnfoldMoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse all">
              <IconButton size="small" onClick={handleCollapseAll} sx={{ p: 0.25 }}>
                <UnfoldLessIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </SearchHeader>
      <FileListContainer>
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              No matching files found
            </Typography>
          </Box>
        )}
      </FileListContainer>
    </SidebarContainer>
  );
};

export default FileTreeSidebar;
