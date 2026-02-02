/**
 * Observation Logger
 * 
 * Central logging and metrics collection for the platform.
 * All significant events are recorded through this module.
 * 
 * ARCHITECTURE:
 * - Observations are structured and typed
 * - Security events get special treatment
 * - In production, these would be sent to a logging service
 */

import type { Observation, ObservationLevel, Resource } from '../core/types';

// ============= Observation Storage =============

const observations: Observation[] = [];
const MAX_OBSERVATIONS = 10000;

let observationCounter = 0;

function generateObservationId(): string {
  return `obs_${Date.now()}_${++observationCounter}`;
}

// ============= Core Logging Functions =============

/**
 * Record an observation
 */
export function observe(params: Omit<Observation, 'id'>): void {
  const observation: Observation = {
    id: generateObservationId(),
    ...params,
  };

  // Add to storage (with rotation)
  observations.push(observation);
  if (observations.length > MAX_OBSERVATIONS) {
    observations.shift();
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    const prefix = getLogPrefix(observation.level);
    console.log(
      `${prefix} [${observation.category}] ${observation.action}`,
      observation.success ? '✓' : '✗',
      observation.duration ? `(${observation.duration}ms)` : '',
      observation.metadata ? observation.metadata : ''
    );
  }
}

/**
 * Record an error observation
 */
export function observeError(
  action: string,
  error: Error,
  metadata?: Record<string, unknown>
): void {
  observe({
    level: 'error',
    category: 'system',
    action,
    timestamp: Date.now(),
    success: false,
    metadata: {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: import.meta.env.DEV ? error.stack : undefined,
      ...metadata,
    },
  });
}

/**
 * Record a security-relevant observation
 * These are always logged and may trigger alerts
 */
export function observeSecurityEvent(
  action: string,
  metadata?: Record<string, unknown>
): void {
  observe({
    level: 'security',
    category: 'auth',
    action,
    timestamp: Date.now(),
    success: false,
    metadata: {
      ...metadata,
      securityEvent: true,
    },
  });

  // In production: send to security monitoring system
  if (import.meta.env.DEV) {
    console.warn(`🔐 SECURITY EVENT: ${action}`, metadata);
  }
}

/**
 * Record a policy decision observation
 */
export function observePolicyDecision(
  action: string,
  resource: Resource,
  allowed: boolean,
  metadata?: Record<string, unknown>
): void {
  observe({
    level: allowed ? 'info' : 'warn',
    category: 'policy',
    action: `${action}:${resource}`,
    resourceType: resource,
    timestamp: Date.now(),
    success: allowed,
    metadata,
  });
}

// ============= Query Functions =============

/**
 * Get recent observations
 */
export function getObservations(params?: {
  level?: ObservationLevel;
  category?: Observation['category'];
  limit?: number;
  since?: number;
}): Observation[] {
  let results = [...observations];

  if (params?.level) {
    results = results.filter(o => o.level === params.level);
  }

  if (params?.category) {
    results = results.filter(o => o.category === params.category);
  }

  if (params?.since) {
    results = results.filter(o => o.timestamp >= params.since!);
  }

  // Sort by timestamp descending
  results.sort((a, b) => b.timestamp - a.timestamp);

  if (params?.limit) {
    results = results.slice(0, params.limit);
  }

  return results;
}

/**
 * Get security events only
 */
export function getSecurityEvents(limit = 100): Observation[] {
  return getObservations({
    level: 'security',
    limit,
  });
}

/**
 * Get observation counts by level
 */
export function getObservationStats(): Record<ObservationLevel, number> {
  const stats: Record<ObservationLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    security: 0,
  };

  for (const obs of observations) {
    stats[obs.level]++;
  }

  return stats;
}

/**
 * Clear all observations (for testing)
 */
export function clearObservations(): void {
  observations.length = 0;
}

// ============= Helpers =============

function getLogPrefix(level: ObservationLevel): string {
  switch (level) {
    case 'debug': return '🔍';
    case 'info': return 'ℹ️';
    case 'warn': return '⚠️';
    case 'error': return '❌';
    case 'security': return '🔐';
  }
}
