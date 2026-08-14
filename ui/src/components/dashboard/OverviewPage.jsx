import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useAppTheme } from '../../theme/useAppTheme';
import { useGetTileConfigQuery, useUpdateTileConfigMutation } from '../../store/api/dashboardApi';
import CommandBar from './CommandBar';
import NotesCard from './NotesCard';
import ReminderCard from './ReminderCard';
import TodoCard from './TodoCard';
import KnowledgeBaseRAGCard from './KnowledgeBaseRAGCard';
import PRReviewsCard from './PRReviewsCard';
import TaskTimelineCard from './TaskTimelineCard';
import PerformanceMetricsCard from './PerformanceMetricsCard';

const TILE_COMPONENTS = {
  contextStream: NotesCard,
  knowledgeBase: KnowledgeBaseRAGCard,
  prReviews: PRReviewsCard,
  performanceMetrics: PerformanceMetricsCard,
  reminders: ReminderCard,
  todos: TodoCard,
  taskTimeline: TaskTimelineCard,
};

// Fallback logic in case x, y, w, h are missing from backend (e.g. legacy data)
const getFallbackGridProps = (tile) => {
  if (tile.x !== undefined) {
    return { x: tile.x, y: tile.y, w: tile.w, h: tile.h };
  }
  
  const isLeft = ['contextStream', 'knowledgeBase', 'prReviews', 'performanceMetrics'].includes(tile.id);
  const w = isLeft ? 7 : 5;
  const x = isLeft ? 0 : 7;
  const h = isLeft ? 4 : 3;
  // just stack them based on order
  const y = (tile.order || 0) * h;
  
  return { x, y, w, h };
};

const OverviewPage = () => {
  const { isDark } = useAppTheme();
  const { data: tileConfigResponse, isLoading } = useGetTileConfigQuery();
  const [updateTileConfig] = useUpdateTileConfigMutation();

  const [localTiles, setLocalTiles] = useState([]);
  const { width, containerRef, mounted } = useContainerWidth();

  useEffect(() => {
    if (tileConfigResponse?.data) {
      // Shallow copy to avoid RTK Query frozen object errors
      const clonedTiles = tileConfigResponse.data.map(t => ({ ...t }));
      setLocalTiles(clonedTiles);
    }
  }, [tileConfigResponse]);

  const baseCardStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px',
    boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  const visibleTiles = localTiles.filter(t => t.visible);

  // Generate the layout array expected by react-grid-layout
  const layout = visibleTiles.map(tile => {
    const props = getFallbackGridProps(tile);
    return {
      i: tile.id,
      x: props.x,
      y: props.y,
      w: props.w,
      h: props.h,
      minW: 3,
      minH: 2
    };
  });

  const handleLayoutChange = (newLayout) => {
    // Only update if there's an actual change to prevent infinite loops or unnecessary API calls
    let hasChanges = false;
    
    const updatedTiles = localTiles.map(tile => {
      const layoutItem = newLayout.find(l => l.i === tile.id);
      if (layoutItem) {
        if (
          tile.x !== layoutItem.x || 
          tile.y !== layoutItem.y || 
          tile.w !== layoutItem.w || 
          tile.h !== layoutItem.h
        ) {
          hasChanges = true;
          return {
            ...tile,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
        }
      }
      return tile;
    });

    if (hasChanges) {
      setLocalTiles(updatedTiles);
      updateTileConfig(updatedTiles);
    }
  };

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2, 
      '& .react-grid-layout': {
        position: 'relative',
        transition: 'height 200ms ease'
      },
      '& .react-grid-item': {
        transition: 'all 200ms ease',
        transitionProperty: 'left, top, width, height'
      },
      '& .react-grid-item.cssTransforms': {
        transitionProperty: 'transform, width, height'
      },
      '& .react-grid-item.resizing': {
        zIndex: 1,
        willChange: 'width, height'
      },
      '& .react-grid-item.react-draggable-dragging': {
        transition: 'none',
        zIndex: 3,
        willChange: 'transform'
      },
      '& .react-grid-item > .react-resizable-handle': {
        position: 'absolute',
        width: '20px',
        height: '20px',
        bottom: '0',
        right: '0',
        cursor: 'se-resize',
        zIndex: 10,
        opacity: 0,
        transition: 'opacity 0.2s',
      },
      '& .react-grid-item:hover > .react-resizable-handle': {
        opacity: 1,
      },
      // Styling the resize handle
      '& .react-resizable-handle::after': {
        content: '""',
        position: 'absolute',
        right: '6px',
        bottom: '6px',
        width: '8px',
        height: '8px',
        borderRight: '2px solid rgba(124, 58, 237, 0.5)',
        borderBottom: '2px solid rgba(124, 58, 237, 0.5)',
      }
    }}>
      <Box sx={{ px: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
          Overview
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Your AI command center. Drag cards by their handles to rearrange, or drag the bottom right corner to resize.
        </Typography>
        <CommandBar />
      </Box>

      <Box ref={containerRef} sx={{ pl: 1, pr: 0, pb: 4, overflowX: 'hidden' }}>
        {mounted && (
          <Responsive
            width={width}
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            margin={[24, 24]}
          >
            {visibleTiles.map(tile => {
              const Component = TILE_COMPONENTS[tile.id];
              if (!Component) return null;
              
              return (
                <Box key={tile.id}>
                  {/* Drag Handle Icon */}
                  <Box 
                    className="drag-handle"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      cursor: 'grab',
                      zIndex: 10,
                      color: 'text.secondary',
                      background: 'rgba(124, 58, 237, 0.1)',
                      borderRadius: '4px',
                      display: 'flex',
                      p: 0.5,
                      '&:active': { cursor: 'grabbing', background: 'rgba(124, 58, 237, 0.2)' },
                      '&:hover': { background: 'rgba(124, 58, 237, 0.15)' }
                    }}
                    title="Drag to move"
                  >
                    <DragIndicator fontSize="small" sx={{ color: '#7C3AED' }} />
                  </Box>
                  
                  {/* The card content */}
                  <Box sx={{ height: '100%', position: 'relative', zIndex: 0 }}>
                    <Component cardStyle={baseCardStyle} />
                  </Box>
                </Box>
              );
            })}
          </Responsive>
        )}
      </Box>
    </Box>
  );
};

export default OverviewPage;
