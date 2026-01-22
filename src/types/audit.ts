/**
 * Audit Mode Types
 * 
 * These types define the data structures for the forensic session replay system.
 * All data is treated as untrusted input - sanitize before rendering.
 */

import type { TelemetryEventType, AlertSeverity } from './index';

// ============= Core Audit Types =============

/**
 * Environment status for Docker-based challenge containers
 * These are ephemeral, isolated, and time-limited
 */
export type EnvironmentStatus = 'starting' | 'ready' | 'stopped' | 'error';

export interface ChallengeEnvironment {
  id: string;
  status: EnvironmentStatus;
  endpoint?: string;
  expiresAt?: number;
}

/**
 * A single telemetry event in the audit timeline
 */
export interface AuditTelemetryEvent {
  id: string;
  timestamp: number;
  type: TelemetryEventType | string;
  payload: Record<string, unknown>;
}

/**
 * Detection signal from the detection engine
 */
export interface AuditDetection {
  ruleId: string;
  severity: Lowercase<AlertSeverity>;
  confidence: number; // 0.0 - 1.0
  message: string;
  timestamp: number;
}

/**
 * UI snapshot for replay reconstruction
 * Treat inputState as untrusted - sanitize before display
 */
export interface AuditUISnapshot {
  timestamp: number;
  route: string;
  inputState: Record<string, unknown>;
  scrollY: number;
  environment?: ChallengeEnvironment;
}

/**
 * Session metadata for list view
 */
export interface AuditSessionSummary {
  sessionId: string;
  userId: string;
  userName?: string;
  challengeId: string;
  challengeTitle?: string;
  startTime: number;
  endTime: number;
  outcome: 'success' | 'failure' | 'abandoned';
  totalAttempts: number;
  hintsUsed: number;
  detectionCount: number;
  highestSeverity?: Lowercase<AlertSeverity>;
}

/**
 * Complete session data for replay
 */
export interface AuditSession {
  sessionId: string;
  userId: string;
  challengeId: string;
  startTime: number;
  endTime: number;
  events: AuditTelemetryEvent[];
  detections: AuditDetection[];
  snapshots: AuditUISnapshot[];
}

// ============= Playback State =============

export type PlaybackSpeed = 1 | 2 | 4;

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: PlaybackSpeed;
  activeSnapshotIndex: number;
}

// ============= Store State =============

export interface AuditState {
  // Data
  session: AuditSession | null;
  events: AuditTelemetryEvent[];
  detections: AuditDetection[];
  snapshots: AuditUISnapshot[];
  
  // Playback
  playbackTime: number;
  playbackSpeed: PlaybackSpeed;
  isPlaying: boolean;
  activeSnapshot: AuditUISnapshot | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Computed
  sessionDuration: number;
  totalAttempts: number;
  hintsUsed: number;
  detectionCount: number;
  highestSeverity: Lowercase<AlertSeverity> | null;
}

// ============= Telemetry Events for Audit Mode =============

export type AuditTelemetryEventType = 
  | 'audit_opened'
  | 'audit_play'
  | 'audit_pause'
  | 'audit_jump'
  | 'audit_speed_change'
  | 'audit_exit';

// ============= API Response Types =============

export interface AuditEventsResponse {
  events: AuditTelemetryEvent[];
}

export interface AuditDetectionsResponse {
  detections: AuditDetection[];
}

export interface AuditSnapshotsResponse {
  snapshots: AuditUISnapshot[];
}

export interface AuditSessionListResponse {
  sessions: AuditSessionSummary[];
  total: number;
}
