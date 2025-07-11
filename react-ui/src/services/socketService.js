import { io } from 'socket.io-client';
import store from '../store';
import { addBuildLog, setBuildError } from '../store/slices/buildSlice';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io('http://localhost:3000', {
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

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      store.dispatch(setBuildError('Failed to connect to build service'));
    });

    // Listen for build progress events
    this.socket.on('build-progress', (data) => {
      console.log('Build progress:', data);
      store.dispatch(addBuildLog(data));
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
