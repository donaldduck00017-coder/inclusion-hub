import { create } from 'zustand';
import type { 
  AuditSession, 
  AuditTelemetryEvent, 
  AuditDetection, 
  AuditUISnapshot,
  PlaybackSpeed,
  AuditState 
} from '@/types/audit';
import type { AlertSeverity } from '@/types';

// Severity priority for comparison
const SEVERITY_PRIORITY: Record<Lowercase<AlertSeverity>, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

interface AuditActions {
  // Data loading
  setSession: (session: AuditSession) => void;
  setEvents: (events: AuditTelemetryEvent[]) => void;
  setDetections: (detections: AuditDetection[]) => void;
  setSnapshots: (snapshots: AuditUISnapshot[]) => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  reset: () => void;
  
  // Navigation
  jumpToDetection: (detection: AuditDetection) => void;
  jumpToTime: (time: number) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Cleanup
  clearSession: () => void;
}

const initialState: AuditState = {
  session: null,
  events: [],
  detections: [],
  snapshots: [],
  playbackTime: 0,
  playbackSpeed: 1,
  isPlaying: false,
  activeSnapshot: null,
  loading: false,
  error: null,
  sessionDuration: 0,
  totalAttempts: 0,
  hintsUsed: 0,
  detectionCount: 0,
  highestSeverity: null,
};

/**
 * Compute derived metrics from session data
 */
function computeMetrics(
  events: AuditTelemetryEvent[], 
  detections: AuditDetection[],
  session: AuditSession | null
): Pick<AuditState, 'sessionDuration' | 'totalAttempts' | 'hintsUsed' | 'detectionCount' | 'highestSeverity'> {
  const totalAttempts = events.filter(e => e.type === 'submission_attempt').length;
  const hintsUsed = events.filter(e => e.type === 'hint_used').length;
  const detectionCount = detections.length;
  
  // Find highest severity
  let highestSeverity: Lowercase<AlertSeverity> | null = null;
  let maxPriority = 0;
  
  for (const detection of detections) {
    const priority = SEVERITY_PRIORITY[detection.severity] || 0;
    if (priority > maxPriority) {
      maxPriority = priority;
      highestSeverity = detection.severity;
    }
  }
  
  const sessionDuration = session 
    ? session.endTime - session.startTime 
    : 0;
  
  return {
    sessionDuration,
    totalAttempts,
    hintsUsed,
    detectionCount,
    highestSeverity,
  };
}

/**
 * Find the active snapshot for a given playback time
 * Returns the latest snapshot BEFORE or AT the current time
 */
function findActiveSnapshot(
  snapshots: AuditUISnapshot[], 
  playbackTime: number,
  sessionStartTime: number
): AuditUISnapshot | null {
  if (snapshots.length === 0) return null;
  
  const absoluteTime = sessionStartTime + playbackTime;
  
  // Find the latest snapshot before or at current time
  let activeSnapshot: AuditUISnapshot | null = null;
  
  for (const snapshot of snapshots) {
    if (snapshot.timestamp <= absoluteTime) {
      activeSnapshot = snapshot;
    } else {
      break; // Snapshots are sorted by time
    }
  }
  
  return activeSnapshot || snapshots[0];
}

export const useAuditStore = create<AuditState & AuditActions>((set, get) => ({
  ...initialState,
  
  // Data loading
  setSession: (session) => {
    const state = get();
    const metrics = computeMetrics(state.events, state.detections, session);
    const activeSnapshot = findActiveSnapshot(state.snapshots, 0, session.startTime);
    
    set({ 
      session,
      ...metrics,
      activeSnapshot,
      playbackTime: 0,
    });
  },
  
  setEvents: (events) => {
    const state = get();
    const metrics = computeMetrics(events, state.detections, state.session);
    set({ events, ...metrics });
  },
  
  setDetections: (detections) => {
    const state = get();
    const metrics = computeMetrics(state.events, detections, state.session);
    set({ detections, ...metrics });
  },
  
  setSnapshots: (snapshots) => {
    const state = get();
    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    const activeSnapshot = state.session 
      ? findActiveSnapshot(sorted, state.playbackTime, state.session.startTime)
      : sorted[0] || null;
    
    set({ snapshots: sorted, activeSnapshot });
  },
  
  // Playback controls
  play: () => set({ isPlaying: true }),
  
  pause: () => set({ isPlaying: false }),
  
  setPlaybackTime: (time) => {
    const state = get();
    const clampedTime = Math.max(0, Math.min(time, state.sessionDuration));
    
    const activeSnapshot = state.session
      ? findActiveSnapshot(state.snapshots, clampedTime, state.session.startTime)
      : null;
    
    set({ playbackTime: clampedTime, activeSnapshot });
  },
  
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  
  reset: () => {
    const state = get();
    const activeSnapshot = state.session
      ? findActiveSnapshot(state.snapshots, 0, state.session.startTime)
      : null;
    
    set({ 
      playbackTime: 0, 
      isPlaying: false,
      activeSnapshot,
    });
  },
  
  // Navigation
  jumpToDetection: (detection) => {
    const state = get();
    if (!state.session) return;
    
    // Find the relative time from session start
    const relativeTime = detection.timestamp - state.session.startTime;
    
    // Jump to slightly before the detection (1 second before)
    const jumpTime = Math.max(0, relativeTime - 1000);
    
    const activeSnapshot = findActiveSnapshot(
      state.snapshots, 
      jumpTime, 
      state.session.startTime
    );
    
    set({ 
      playbackTime: jumpTime,
      isPlaying: false,
      activeSnapshot,
    });
  },
  
  jumpToTime: (time) => {
    const state = get();
    if (!state.session) return;
    
    const clampedTime = Math.max(0, Math.min(time, state.sessionDuration));
    const activeSnapshot = findActiveSnapshot(
      state.snapshots, 
      clampedTime, 
      state.session.startTime
    );
    
    set({ playbackTime: clampedTime, activeSnapshot });
  },
  
  // Loading states
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  // Cleanup
  clearSession: () => set(initialState),
}));
