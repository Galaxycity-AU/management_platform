import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { initializeEventEmitter } from './socket/eventEmitter.js';

const API_PORT = process.env.API_PORT || 3001;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Connection settings
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize the event emitter with the Socket.io instance
initializeEventEmitter(io);

// Set up socket connection handlers
setupSocketHandlers(io);

// Start the server
httpServer.listen(API_PORT, () => {
  console.log(`API running on http://localhost:${API_PORT}`);
  console.log(`WebSocket server running on ws://localhost:${API_PORT}`);
  console.log(`Health check: http://localhost:${API_PORT}/health`);
});

// Export io for potential direct use
export { io };
