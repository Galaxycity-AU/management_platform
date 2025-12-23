import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Socket.io server URL - defaults to the API server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Create the context
const SocketContext = createContext(null);

/**
 * Socket Provider Component
 * Manages the WebSocket connection and provides socket instance to all children
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to server:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  // Join a specific room
  const joinRoom = useCallback((roomName) => {
    if (socket && isConnected) {
      socket.emit(`join:${roomName}`);
      console.log(`[Socket] Joining room: ${roomName}`);
    }
  }, [socket, isConnected]);

  // Leave a specific room
  const leaveRoom = useCallback((roomName) => {
    if (socket && isConnected) {
      socket.emit(`leave:${roomName}`);
      console.log(`[Socket] Leaving room: ${roomName}`);
    }
  }, [socket, isConnected]);

  // Subscribe to an event
  const subscribe = useCallback((eventName, callback) => {
    if (socket) {
      socket.on(eventName, callback);
      return () => socket.off(eventName, callback);
    }
    return () => {};
  }, [socket]);

  // Unsubscribe from an event
  const unsubscribe = useCallback((eventName, callback) => {
    if (socket) {
      socket.off(eventName, callback);
    }
  }, [socket]);

  // Context value
  const value = {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    subscribe,
    unsubscribe,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access the socket context
 * @returns {Object} Socket context value
 */
export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;

