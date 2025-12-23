/**
 * Socket.io connection handler
 * Manages WebSocket connections and room management
 */

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a specific room (e.g., for project-specific updates)
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`[Socket] ${socket.id} joined project:${projectId}`);
    });

    // Leave a project room
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`[Socket] ${socket.id} left project:${projectId}`);
    });

    // Join dashboard room for real-time dashboard updates
    socket.on('join:dashboard', () => {
      socket.join('dashboard');
      console.log(`[Socket] ${socket.id} joined dashboard room`);
    });

    // Join approvals room for real-time approval updates
    socket.on('join:approvals', () => {
      socket.join('approvals');
      console.log(`[Socket] ${socket.id} joined approvals room`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error);
    });
  });

  console.log('[Socket] Socket handlers initialized');
}

export default setupSocketHandlers;

