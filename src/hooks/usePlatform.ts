/**
 * usePlatform Hook
 * 
 * React hook for interacting with the platform control plane.
 * Provides authenticated access to platform services through
 * the enforced request lifecycle.
 */

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  execute,
  type Action,
  type Resource,
  type Response,
  type RequestContext,
} from '@/platform';

interface UsePlatformOptions {
  context?: Partial<RequestContext>;
}

interface ExecuteParams<T> {
  action: Action;
  resource: Resource;
  resourceId?: string;
  payload: T;
}

/**
 * Hook for executing platform requests with automatic auth
 */
export function usePlatform(options: UsePlatformOptions = {}) {
  const { token } = useAuthStore();
  
  /**
   * Execute a platform request
   * Automatically includes auth token from store
   */
  const executeRequest = useCallback(
    async <TReq, TRes>(params: ExecuteParams<TReq>): Promise<Response<TRes>> => {
      return execute<TReq, TRes>({
        token: token ?? undefined,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        payload: params.payload,
        context: options.context,
      });
    },
    [token, options.context]
  );

  /**
   * Convenience methods for common operations
   */
  const methods = useMemo(() => ({
    // Read a resource
    read: <TRes>(resource: Resource, resourceId?: string, payload = {}) =>
      executeRequest<Record<string, unknown>, TRes>({
        action: 'read',
        resource,
        resourceId,
        payload,
      }),
    
    // Write to a resource
    write: <TReq, TRes>(resource: Resource, payload: TReq, resourceId?: string) =>
      executeRequest<TReq, TRes>({
        action: 'write',
        resource,
        resourceId,
        payload,
      }),
    
    // Delete a resource
    remove: <TRes>(resource: Resource, resourceId: string) =>
      executeRequest<Record<string, never>, TRes>({
        action: 'delete',
        resource,
        resourceId,
        payload: {},
      }),
    
    // Execute an action on a resource
    exec: <TReq, TRes>(resource: Resource, payload: TReq, resourceId?: string) =>
      executeRequest<TReq, TRes>({
        action: 'execute',
        resource,
        resourceId,
        payload,
      }),
  }), [executeRequest]);

  return {
    execute: executeRequest,
    ...methods,
    isAuthenticated: !!token,
  };
}

/**
 * Hook for telemetry-specific operations
 */
export function useTelemetry() {
  const platform = usePlatform();
  
  return useMemo(() => ({
    // Track an event
    track: (type: string, metadata?: Record<string, unknown>) =>
      platform.write('telemetry-event', {
        event: {
          type,
          timestamp: Date.now(),
          userId: '', // Will be filled from identity
          metadata,
        },
      }),
    
    // Start a session
    startSession: (challengeId: string) =>
      platform.exec<{ challengeId: string }, { sessionId: string }>(
        'telemetry-session',
        { challengeId }
      ),
    
    // End a session
    endSession: (sessionId: string, outcome: 'success' | 'failure' | 'abandoned') =>
      platform.write('telemetry-session', { sessionId, outcome }),
    
    // Get session list
    getSessions: (params?: { userId?: string; challengeId?: string; limit?: number }) =>
      platform.read('telemetry-session', undefined, params),
  }), [platform]);
}
