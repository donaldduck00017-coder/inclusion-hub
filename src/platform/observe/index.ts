/**
 * Observe Module - Public Interface
 * 
 * Central observability for the platform:
 * - Structured logging with levels
 * - Security event tracking
 * - Metrics collection
 * 
 * ARCHITECTURE:
 * - All significant events are observed
 * - Security events trigger special handling
 * - Metrics are collected for monitoring
 */

// Logger
export {
  observe,
  observeError,
  observeSecurityEvent,
  observePolicyDecision,
  getObservations,
  getSecurityEvents,
  getObservationStats,
  clearObservations,
} from './logger';

// Metrics
export {
  incrementCounter,
  getCounter,
  setGauge,
  getGauge,
  observeHistogram,
  getHistogramStats,
  getAllMetrics,
  clearMetrics,
} from './metrics';

// Re-export types
export type { Observation, ObservationLevel } from '../core/types';
