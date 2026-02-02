/**
 * Request Lifecycle Router
 * 
 * Enforces the request lifecycle:
 *   Request → Auth → Policy → Router → Service → Observe → Response
 * 
 * NO code path should bypass this lifecycle.
 * Services cannot talk directly to auth or make policy decisions.
 */

import type { 
  Request, 
  Response, 
  RequestContext, 
  Identity,
  Action,
  Resource,
  ServiceRequest,
  ServiceResult,
  ResponseError,
} from '../types';
import { validateToken } from '../auth';
import { can } from '../policy';
import { observe, observeError, observeSecurityEvent } from '../../observe/logger';

// ============= Request ID Generation =============

let requestCounter = 0;

function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============= Service Registry =============

type ServiceHandler<TReq = unknown, TRes = unknown> = (
  request: ServiceRequest<TReq>
) => Promise<ServiceResult<TRes>>;

interface ServiceRegistration {
  action: Action;
  resource: Resource;
  handler: ServiceHandler;
}

const serviceRegistry = new Map<string, ServiceRegistration>();

function getServiceKey(action: Action, resource: Resource): string {
  return `${action}:${resource}`;
}

/**
 * Register a service handler for an action+resource pair
 */
export function registerService<TReq = unknown, TRes = unknown>(
  action: Action,
  resource: Resource,
  handler: ServiceHandler<TReq, TRes>
): void {
  const key = getServiceKey(action, resource);
  serviceRegistry.set(key, {
    action,
    resource,
    handler: handler as ServiceHandler,
  });
}

/**
 * Get a registered service handler
 */
function getService(action: Action, resource: Resource): ServiceHandler | null {
  const key = getServiceKey(action, resource);
  const registration = serviceRegistry.get(key);
  return registration?.handler || null;
}

// ============= Request Lifecycle =============

interface ExecuteOptions<T> {
  token?: string;
  action: Action;
  resource: Resource;
  resourceId?: string;
  payload: T;
  context?: Partial<RequestContext>;
}

/**
 * Execute a request through the full lifecycle
 * 
 * This is the ONLY way to invoke services from the UI or API.
 */
export async function execute<TReq, TRes>(
  options: ExecuteOptions<TReq>
): Promise<Response<TRes>> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const correlationId = options.context?.correlationId || generateCorrelationId();
  
  const context: RequestContext = {
    source: options.context?.source || 'ui',
    correlationId,
    sessionId: options.context?.sessionId,
    challengeId: options.context?.challengeId,
    ipHash: options.context?.ipHash,
    userAgent: options.context?.userAgent,
  };

  // Build request object
  const request: Request<TReq> = {
    id: requestId,
    phase: 'received',
    action: options.action,
    resource: options.resource,
    resourceId: options.resourceId,
    payload: options.payload,
    context,
    timestamp: startTime,
  };

  try {
    // ============= PHASE 1: Authentication =============
    request.phase = 'authenticated';
    
    let identity: Identity | null = null;
    if (options.token) {
      identity = validateToken(options.token);
      if (!identity) {
        observeSecurityEvent('auth_failed', {
          requestId,
          reason: 'Invalid or expired token',
        });
        
        return createErrorResponse<TRes>(requestId, startTime, {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token',
        });
      }
      request.identity = identity;
      context.sessionId = identity.sessionId;
    }

    // ============= PHASE 2: Authorization =============
    request.phase = 'authorized';
    
    const policyResult = can(identity, options.action, options.resource, {
      timestamp: startTime,
      resourceId: options.resourceId,
      challengeId: context.challengeId,
      requestPath: `${options.action}:${options.resource}`,
    });

    if (policyResult.decision === 'DENY') {
      if (policyResult.auditLog) {
        observeSecurityEvent('policy_denied', {
          requestId,
          userId: identity?.userId,
          action: options.action,
          resource: options.resource,
          reason: policyResult.reason,
        });
      }

      return createErrorResponse<TRes>(requestId, startTime, {
        code: 'FORBIDDEN',
        message: policyResult.reason,
      });
    }

    // ============= PHASE 3: Routing =============
    request.phase = 'routed';
    
    const handler = getService(options.action, options.resource);
    if (!handler) {
      return createErrorResponse<TRes>(requestId, startTime, {
        code: 'NOT_FOUND',
        message: `No handler for ${options.action}:${options.resource}`,
      });
    }

    // ============= PHASE 4: Execution =============
    request.phase = 'executed';
    
    const serviceRequest: ServiceRequest<TReq> = {
      identity: identity!,
      action: options.action,
      resource: options.resource,
      resourceId: options.resourceId,
      payload: options.payload,
      context,
    };

    const result = await handler(serviceRequest) as ServiceResult<TRes>;

    // ============= PHASE 5: Observation =============
    request.phase = 'observed';
    
    observe({
      level: result.success ? 'info' : 'warn',
      category: 'service',
      action: `${options.action}:${options.resource}`,
      actorId: identity?.userId,
      resourceType: options.resource,
      resourceId: options.resourceId,
      timestamp: Date.now(),
      success: result.success,
      duration: Date.now() - startTime,
      metadata: {
        requestId,
        correlationId,
      },
    });

    // ============= PHASE 6: Response =============
    request.phase = 'responded';
    
    if (!result.success) {
      return createErrorResponse<TRes>(requestId, startTime, {
        code: result.error?.code || 'SERVICE_ERROR',
        message: result.error?.message || 'Service execution failed',
      });
    }

    return {
      requestId,
      success: true,
      data: result.data,
      meta: {
        duration: Date.now() - startTime,
        cached: false,
      },
    };

  } catch (error) {
    // Unexpected error - log and return generic error
    observeError('request_lifecycle_error', error as Error, {
      requestId,
      phase: request.phase,
      action: options.action,
      resource: options.resource,
    });

    return createErrorResponse<TRes>(requestId, startTime, {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}

/**
 * Helper to create error responses
 */
function createErrorResponse<T>(
  requestId: string,
  startTime: number,
  error: ResponseError
): Response<T> {
  return {
    requestId,
    success: false,
    error,
    meta: {
      duration: Date.now() - startTime,
      cached: false,
    },
  };
}

/**
 * Clear all registered services (for testing)
 */
export function clearServices(): void {
  serviceRegistry.clear();
}
