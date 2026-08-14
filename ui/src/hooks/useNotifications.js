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
    
    todos.forEach(item => {
      const isDone = item.done === true || item.status === 'done';
      const targetTime = item.notifyAt || item.remindAt;

      if (isDone || !targetTime) return;
      
      const notifyTime = new Date(targetTime).getTime();
      const delay = notifyTime - now;

      // Only set timer if it's in the future and not already set
      if (delay > 0 && delay < 86400000 && !timersRef.current[item.id]) { // max 24h timer
        timersRef.current[item.id] = setTimeout(() => {
          const notificationTitle = item.remindAt ? 'AI Workflow Reminder' : 'AI Workflow TODO';
          const notification = new Notification(notificationTitle, {
            body: item.title,
            icon: '/favicon.ico',
            requireInteraction: true,
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Clean up timer ref
          delete timersRef.current[item.id];
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
