import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNotificationPermission, setNotificationPermission } from '../store/slices/dashboardSlice';

export const useNotifications = (todos = []) => {
  const dispatch = useDispatch();
  const permission = useSelector(selectNotificationPermission);
  const timersRef = useRef({});

  useEffect(() => {
    if ('Notification' in window) {
      dispatch(setNotificationPermission(Notification.permission));
    }
  }, [dispatch]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    dispatch(setNotificationPermission(result));
    return result;
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const now = Date.now();
    
    todos.forEach(todo => {
      if (todo.done || !todo.notifyAt) return;
      
      const notifyTime = new Date(todo.notifyAt).getTime();
      const delay = notifyTime - now;

      // Only set timer if it's in the future and not already set
      if (delay > 0 && delay < 86400000 && !timersRef.current[todo.id]) { // max 24h timer
        timersRef.current[todo.id] = setTimeout(() => {
          const notification = new Notification('AI Workflow TODO', {
            body: todo.title,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Clean up timer ref
          delete timersRef.current[todo.id];
        }, delay);
      }
    });

    // Cleanup function
    return () => {
      // We don't clear all timers on every render, only when the component unmounts
    };
  }, [todos, permission]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  return { permission, requestPermission };
};

export default useNotifications;
