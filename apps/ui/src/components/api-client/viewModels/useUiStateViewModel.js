import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveTab,
  toggleLeftSidebar,
  toggleRightSidebar,
} from '../../../store/slices/apiClientSlice';

// UI State ViewModel Hook
export const useUiStateViewModel = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    activeTab,
  } = useSelector((state) => state.apiClient);
  
  // UI actions
  const handleToggleLeftSidebar = useCallback(() => {
    dispatch(toggleLeftSidebar());
  }, [dispatch]);
  
  const handleToggleRightSidebar = useCallback(() => {
    dispatch(toggleRightSidebar());
  }, [dispatch]);
  
  const handleSetActiveTab = useCallback((tabIndex) => {
    dispatch(setActiveTab(tabIndex));
  }, [dispatch]);
  
  return {
    // State
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    activeTab,
    
    // Actions
    toggleLeftSidebar: handleToggleLeftSidebar,
    toggleRightSidebar: handleToggleRightSidebar,
    setActiveTab: handleSetActiveTab,
  };
};
