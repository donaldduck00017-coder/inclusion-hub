/**
 * Telemetry Service
 * 
 * Handles telemetry event collection and session recording.
 * This service is accessed through the platform router.
 * 
 * TRUST BOUNDARY:
 * - All requests are authenticated and authorized by the router
 * - Privacy controls are enforced here
 * - Data minimization is applied before storage
 */

import type { ServiceRequest, ServiceResult } from '../../core/types';
import { registerService } from '../../core/router';
import { observe, incrementCounter } from '../../observe';
import { hashForPrivacy } from '../../core/auth';

// ============= Types =============

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: number;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export type TelemetryEventType = 
  | 'session_start'
  | 'session_end'
  | 'challenge_start'
  | 'hint_used'
  | 'submission_attempt'
  | 'time_on_task'
  | 'navigation'
  | 'focus_lost'
  | 'challenge_abandon';

export interface TelemetrySession {
  sessionId: string;
  userId: string;
  challengeId: string;
  startTime: number;
  endTime: number;
  events: TelemetryEvent[];
  outcome: 'success' | 'failure' | 'abandoned';
  recordingConsent: boolean;
  dataRetentionDate: number;
  minimizationApplied: boolean;
}

// ============= State =============

interface TelemetryState {
  eventQueue: TelemetryEvent[];
  sessions: Map<string, TelemetrySession>;
  currentSessionId: string | null;
  eventsProcessed: number;
  failedFlushes: number;
  lastFlushTime: number;
  privacyMode: boolean;
}

const state: TelemetryState = {
  eventQueue: [],
  sessions: new Map(),
  currentSessionId: null,
  eventsProcessed: 0,
  failedFlushes: 0,
  lastFlushTime: Date.now(),
  privacyMode: false,
};

// ============= Configuration =============

const config = {
  batchSize: 50,
  flushInterval: 30000,
  dataRetentionDays: 90,
};

// ============= Internal Functions =============

function generateSessionId(): string {
  return `tsess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function applyPrivacyMinimization(event: TelemetryEvent): TelemetryEvent {
  if (!state.privacyMode) {
    return event;
  }

  return {
    ...event,
    userId: hashForPrivacy(event.userId),
    metadata: event.metadata ? {
      ...event.metadata,
      hintContent: undefined, // Remove hint text
      userInput: undefined,   // Remove user input
    } : undefined,
  };
}

// ============= Service Handlers =============

/**
 * Track a telemetry event
 */
async function handleTrackEvent(
  request: ServiceRequest<{ event: TelemetryEvent }>
): Promise<ServiceResult<{ queued: boolean }>> {
  const { event } = request.payload;
  
  // Apply privacy minimization
  const sanitizedEvent = applyPrivacyMinimization(event);
  
  // Add to queue
  state.eventQueue.push(sanitizedEvent);
  incrementCounter('telemetry_events_queued', { type: event.type });
  
  // Auto-flush if queue is full
  if (state.eventQueue.length >= config.batchSize) {
    await flushEvents();
  }
  
  observe({
    level: 'debug',
    category: 'service',
    action: 'telemetry:track',
    actorId: request.identity.userId,
    timestamp: Date.now(),
    success: true,
    metadata: { eventType: event.type },
  });

  return {
    success: true,
    data: { queued: true },
  };
}

/**
 * Start a telemetry session
 */
async function handleStartSession(
  request: ServiceRequest<{ challengeId: string }>
): Promise<ServiceResult<{ sessionId: string }>> {
  const { challengeId } = request.payload;
  const sessionId = generateSessionId();
  
  const session: TelemetrySession = {
    sessionId,
    userId: state.privacyMode 
      ? hashForPrivacy(request.identity.userId) 
      : request.identity.userId,
    challengeId,
    startTime: Date.now(),
    endTime: 0,
    events: [],
    outcome: 'abandoned',
    recordingConsent: true,
    dataRetentionDate: Date.now() + config.dataRetentionDays * 24 * 60 * 60 * 1000,
    minimizationApplied: state.privacyMode,
  };
  
  state.sessions.set(sessionId, session);
  state.currentSessionId = sessionId;
  
  incrementCounter('telemetry_sessions_started');
  
  return {
    success: true,
    data: { sessionId },
  };
}

/**
 * End a telemetry session
 */
async function handleEndSession(
  request: ServiceRequest<{ sessionId: string; outcome: 'success' | 'failure' | 'abandoned' }>
): Promise<ServiceResult<{ ended: boolean }>> {
  const { sessionId, outcome } = request.payload;
  
  const session = state.sessions.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    };
  }
  
  session.endTime = Date.now();
  session.outcome = outcome;
  
  if (state.currentSessionId === sessionId) {
    state.currentSessionId = null;
  }
  
  incrementCounter('telemetry_sessions_ended', { outcome });
  
  return {
    success: true,
    data: { ended: true },
  };
}

/**
 * Read telemetry sessions (for audit)
 */
async function handleReadSessions(
  request: ServiceRequest<{ 
    userId?: string; 
    challengeId?: string; 
    limit?: number;
  }>
): Promise<ServiceResult<{ sessions: TelemetrySession[]; total: number }>> {
  const { userId, challengeId, limit = 50 } = request.payload;
  
  let sessions = Array.from(state.sessions.values());
  
  if (userId) {
    sessions = sessions.filter(s => s.userId === userId);
  }
  
  if (challengeId) {
    sessions = sessions.filter(s => s.challengeId === challengeId);
  }
  
  const total = sessions.length;
  sessions = sessions.slice(0, limit);
  
  return {
    success: true,
    data: { sessions, total },
  };
}

/**
 * Get queue status
 */
async function handleGetStatus(
  _request: ServiceRequest<Record<string, never>>
): Promise<ServiceResult<{
  queueSize: number;
  eventsProcessed: number;
  failedFlushes: number;
  lastFlushTime: number;
}>> {
  return {
    success: true,
    data: {
      queueSize: state.eventQueue.length,
      eventsProcessed: state.eventsProcessed,
      failedFlushes: state.failedFlushes,
      lastFlushTime: state.lastFlushTime,
    },
  };
}

/**
 * Flush the event queue
 */
async function flushEvents(): Promise<void> {
  if (state.eventQueue.length === 0) {
    return;
  }

  const eventsToFlush = state.eventQueue.length;
  
  // Simulate occasional flush failure (5% chance in dev)
  if (import.meta.env.DEV && Math.random() < 0.05) {
    state.failedFlushes++;
    incrementCounter('telemetry_flush_failures');
    return;
  }
  
  // In production: send to telemetry backend
  state.eventsProcessed += eventsToFlush;
  state.eventQueue = [];
  state.lastFlushTime = Date.now();
  
  incrementCounter('telemetry_events_flushed', {}, eventsToFlush);
  
  observe({
    level: 'info',
    category: 'service',
    action: 'telemetry:flush',
    timestamp: Date.now(),
    success: true,
    metadata: { count: eventsToFlush },
  });
}

// ============= Service Registration =============

/**
 * Register telemetry service handlers with the router
 */
export function registerTelemetryService(): void {
  // Write: Track events
  registerService('write', 'telemetry-event', handleTrackEvent);
  
  // Execute: Start session
  registerService('execute', 'telemetry-session', handleStartSession);
  
  // Write: End session (updates existing)
  registerService('write', 'telemetry-session', handleEndSession);
  
  // Read: Get sessions
  registerService('read', 'telemetry-session', handleReadSessions);
  
  // Read: Get status
  registerService('read', 'telemetry-event', handleGetStatus);
}

/**
 * Set privacy mode
 */
export function setPrivacyMode(enabled: boolean): void {
  state.privacyMode = enabled;
}

/**
 * Reset state (for testing)
 */
export function resetTelemetryState(): void {
  state.eventQueue = [];
  state.sessions.clear();
  state.currentSessionId = null;
  state.eventsProcessed = 0;
  state.failedFlushes = 0;
  state.lastFlushTime = Date.now();
}
