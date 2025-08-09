import { io } from 'socket.io-client';
import store from '../store';
import {
  addBuildLog,
  setBranchName,
  setBuildError,
} from '../store/slices/buildSlice';
import { API_BASE_URL } from '../config/environment.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      store.dispatch(setBuildError('Failed to connect to build service'));
    });

    // Listen for build progress events
    this.socket.on('build-progress', data => {
      console.log('Build progress:', data);
      store.dispatch(addBuildLog(data));

      // Check if the message contains branch name information
      if (data.message && typeof data.message === 'string') {
        // Look for branch name patterns in the message
        const branchNameMatch =
          data.message.match(/(?:branch|Branch):\s*([^\s\n]+)/i) ||
          data.message.match(
            /(?:created branch|switching to branch|on branch):\s*([^\s\n]+)/i
          ) ||
          data.message.match(/(?:git checkout -b|git branch)\s+([^\s\n]+)/i);

        if (branchNameMatch && branchNameMatch[1]) {
          const branchName = branchNameMatch[1].trim();
          console.log('Captured branch name from WebSocket:', branchName);
          store.dispatch(setBranchName(branchName));
        }
      }

      // Also check if data has a specific branchName field
      if (data.branchName) {
        console.log(
          'Captured branch name from WebSocket data:',
          data.branchName
        );
        store.dispatch(setBranchName(data.branchName));
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Method to emit events if needed in the future
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
