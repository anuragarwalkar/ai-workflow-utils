import { store } from '../store';
import { showNotification } from '../store/slices/uiSlice';

/**
 * Toast Service for displaying notifications throughout the application
 * Provides a simple API to show success, error, warning, and info messages
 */
class ToastService {
  /**
   * Show a success notification
   * @param {string} message - The message to display
   */
  static success(message) {
    store.dispatch(showNotification({
      message,
      severity: 'success'
    }));
  }

  /**
   * Show an error notification
   * @param {string} message - The error message to display
   */
  static error(message) {
    store.dispatch(showNotification({
      message,
      severity: 'error'
    }));
  }

  /**
   * Show a warning notification
   * @param {string} message - The warning message to display
   */
  static warning(message) {
    store.dispatch(showNotification({
      message,
      severity: 'warning'
    }));
  }

  /**
   * Show an info notification
   * @param {string} message - The info message to display
   */
  static info(message) {
    store.dispatch(showNotification({
      message,
      severity: 'info'
    }));
  }

  /**
   * Handle API errors and display appropriate error messages
   * @param {Object} error - The error object from RTK Query
   * @param {string} defaultMessage - Default message to show if error parsing fails
   */
  static handleApiError(error, defaultMessage = 'An error occurred') {
    let message = defaultMessage;

    if (error?.data?.error) {
      // Server returned structured error
      message = error.data.error;
    } else if (error?.data?.message) {
      // Server returned message field
      message = error.data.message;
    } else if (error?.message) {
      // RTK Query error message
      message = error.message;
    } else if (typeof error === 'string') {
      // String error
      message = error;
    }

    this.error(message);
  }

  /**
   * Handle successful operations and display success messages
   * @param {Object} response - The response object from RTK Query
   * @param {string} defaultMessage - Default message to show
   */
  static handleApiSuccess(response, defaultMessage = 'Operation completed successfully') {
    let message = defaultMessage;

    if (response?.message) {
      message = response.message;
    } else if (response?.data?.message) {
      message = response.data.message;
    }

    this.success(message);
  }
}

export default ToastService;
