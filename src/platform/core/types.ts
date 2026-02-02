/**
 * Platform Core Types
 * 
 * Canonical type definitions for the control plane.
 * These types enforce trust boundaries and request lifecycle contracts.
 */

// ============= Identity Types =============

export type UserRole = 'student' | 'instructor' | 'admin';

export interface Identity {
  userId: string;
  role: UserRole;
  sessionId: string;
  tokenExpiry: number;
  permissions: Permission[];
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  ipHash?: string;
  userAgent?: string;
}

// ============= Policy Types =============

export type Permission =
  // Challenge permissions
  | 'challenges:view'
  | 'challenges:submit'
  | 'challenges:create'
  | 'challenges:delete'
  // Progress permissions
  | 'progress:view'
  | 'progress:view-class'
  | 'progress:view-all'
  // Hint permissions
  | 'hints:use'
  // SOC permissions
  | 'soc:view'
  | 'soc:manage'
  // Audit permissions
  | 'audit:view'
  | 'audit:replay'
  // Health permissions
  | 'health:view'
  | 'health:manage'
  // Admin permissions
  | 'admin:kill-switches'
  | 'admin:users'
  // Telemetry permissions
  | 'telemetry:view'
  | 'telemetry:export';

export type Action =
  | 'read'
  | 'write'
  | 'delete'
  | 'execute'
  | 'admin';

export type Resource =
  | 'challenge'
  | 'submission'
  | 'progress'
  | 'hint'
  | 'soc-alert'
  | 'audit-session'
  | 'health-metrics'
  | 'kill-switch'
  | 'user'
  | 'telemetry-event'
  | 'telemetry-session';

export interface PolicyContext {
  resourceOwnerId?: string;
  resourceId?: string;
  challengeId?: string;
  timestamp: number;
  ipHash?: string;
  requestPath?: string;
}

export type PolicyDecision = 'ALLOW' | 'DENY';

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
  auditLog?: boolean;
  rateLimit?: number;
}

// ============= Request Lifecycle Types =============

export type RequestPhase = 
  | 'received'
  | 'authenticated'
  | 'authorized'
  | 'routed'
  | 'executed'
  | 'observed'
  | 'responded';

export interface Request<T = unknown> {
  id: string;
  phase: RequestPhase;
  identity?: Identity;
  action: Action;
  resource: Resource;
  resourceId?: string;
  payload: T;
  context: RequestContext;
  timestamp: number;
}

export interface RequestContext {
  sessionId?: string;
  challengeId?: string;
  ipHash?: string;
  userAgent?: string;
  source: 'ui' | 'api' | 'internal';
  correlationId: string;
}

export interface Response<T = unknown> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: ResponseError;
  meta: ResponseMeta;
}

export interface ResponseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  duration: number;
  cached: boolean;
  rateLimit?: {
    remaining: number;
    resetAt: number;
  };
}

// ============= Observation Types =============

export type ObservationLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

export interface Observation {
  id: string;
  level: ObservationLevel;
  category: 'auth' | 'policy' | 'service' | 'system';
  action: string;
  actorId?: string;
  resourceType?: Resource;
  resourceId?: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

// ============= Service Types =============

export interface ServiceRequest<T = unknown> {
  identity: Identity;
  action: Action;
  resource: Resource;
  resourceId?: string;
  payload: T;
  context: RequestContext;
}

export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============= Kill Switch Types =============

export interface KillSwitch {
  id: string;
  name: string;
  enabled: boolean;
  reason?: string;
  enabledBy?: string;
  enabledAt?: number;
}

export interface KillSwitchState {
  disableTelemetry: boolean;
  disableAiTutor: boolean;
  readOnlyMode: boolean;
  emergencyShutdown: boolean;
}
