import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Custom hook for socket.io functionality
 * Provides easy access to socket events and connection status
 */
export function useSocket() {
  const { socket, isConnected, connectionError, joinRoom, leaveRoom, subscribe, unsubscribe } = useSocketContext();

  return {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook to subscribe to a socket event with automatic cleanup
 * @param {string} eventName - The event name to listen for
 * @param {function} callback - The callback function to call when the event is received
 * @param {array} deps - Dependencies for the callback (like useEffect deps)
 */
export function useSocketEvent(eventName, callback, deps = []) {
  const { subscribe } = useSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(eventName, callback);
    return unsubscribe;
  }, [eventName, subscribe, ...deps]);
}

/**
 * Hook to join a room on mount and leave on unmount
 * @param {string} roomName - The room name to join
 */
export function useSocketRoom(roomName) {
  const { joinRoom, leaveRoom, isConnected } = useSocketContext();

  useEffect(() => {
    if (isConnected && roomName) {
      joinRoom(roomName);
      return () => leaveRoom(roomName);
    }
  }, [isConnected, roomName, joinRoom, leaveRoom]);
}

/**
 * Hook for dashboard real-time updates
 * Subscribes to dashboard-related events
 * @param {object} handlers - Object containing event handlers
 * @param {function} handlers.onAlertsUpdate - Called when dashboard alerts are updated
 * @param {function} handlers.onStatsUpdate - Called when stats are updated
 */
export function useDashboardSocket({ onAlertsUpdate, onStatsUpdate }) {
  const { subscribe, isConnected } = useSocketContext();

  // Join dashboard room
  useSocketRoom('dashboard');

  // Subscribe to dashboard alerts
  useEffect(() => {
    if (onAlertsUpdate) {
      const unsubscribe = subscribe('dashboard:alerts', onAlertsUpdate);
      return unsubscribe;
    }
  }, [subscribe, onAlertsUpdate]);

  // Subscribe to stats updates
  useEffect(() => {
    if (onStatsUpdate) {
      const unsubscribe = subscribe('stats:updated', onStatsUpdate);
      return unsubscribe;
    }
  }, [subscribe, onStatsUpdate]);

  return { isConnected };
}

/**
 * Hook for approval queue real-time updates
 * Subscribes to approval-related events
 * @param {object} handlers - Object containing event handlers
 * @param {function} handlers.onApprovalUpdate - Called when an approval is updated
 * @param {function} handlers.onJobUpdate - Called when a job is updated
 */
export function useApprovalSocket({ onApprovalUpdate, onJobUpdate }) {
  const { subscribe, isConnected } = useSocketContext();

  // Join approvals room
  useSocketRoom('approvals');

  // Subscribe to approval updates
  useEffect(() => {
    if (onApprovalUpdate) {
      const unsubscribe = subscribe('approval:updated', onApprovalUpdate);
      return unsubscribe;
    }
  }, [subscribe, onApprovalUpdate]);

  // Subscribe to job updates
  useEffect(() => {
    if (onJobUpdate) {
      const unsubscribe = subscribe('job:updated', onJobUpdate);
      return unsubscribe;
    }
  }, [subscribe, onJobUpdate]);

  return { isConnected };
}

/**
 * Hook for job-related real-time updates
 * Subscribes to job events (created, updated, deleted)
 * @param {object} handlers - Object containing event handlers
 * @param {function} handlers.onJobCreated - Called when a job is created
 * @param {function} handlers.onJobUpdated - Called when a job is updated
 * @param {function} handlers.onJobDeleted - Called when a job is deleted
 * @param {string} projectId - Optional project ID to join project-specific room
 */
export function useJobSocket({ onJobCreated, onJobUpdated, onJobDeleted, projectId }) {
  const { subscribe, isConnected, joinRoom, leaveRoom } = useSocketContext();

  // Join project-specific room if projectId is provided
  useEffect(() => {
    if (isConnected && projectId) {
      joinRoom(`project:${projectId}`);
      return () => leaveRoom(`project:${projectId}`);
    }
  }, [isConnected, projectId, joinRoom, leaveRoom]);

  // Subscribe to job created
  useEffect(() => {
    if (onJobCreated) {
      const unsubscribe = subscribe('job:created', onJobCreated);
      return unsubscribe;
    }
  }, [subscribe, onJobCreated]);

  // Subscribe to job updated
  useEffect(() => {
    if (onJobUpdated) {
      const unsubscribe = subscribe('job:updated', onJobUpdated);
      return unsubscribe;
    }
  }, [subscribe, onJobUpdated]);

  // Subscribe to job deleted
  useEffect(() => {
    if (onJobDeleted) {
      const unsubscribe = subscribe('job:deleted', onJobDeleted);
      return unsubscribe;
    }
  }, [subscribe, onJobDeleted]);

  return { isConnected };
}

export default useSocket;

