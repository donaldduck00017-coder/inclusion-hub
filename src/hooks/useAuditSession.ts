/**
 * Audit Session Hook
 * 
 * Manages loading and playback of audit session data.
 * Handles parallel data fetching with error resilience.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuditStore } from '@/store/auditStore';
import { auditService } from '@/services';
import { useTelemetryStore } from '@/store/telemetryStore';
import type { AuditDetection } from '@/types/audit';

interface UseAuditSessionOptions {
  sessionId: string;
  autoPlay?: boolean;
}

export function useAuditSession({ sessionId, autoPlay = false }: UseAuditSessionOptions) {
  // Get individual store actions to avoid dependency issues
  const setLoading = useAuditStore((state) => state.setLoading);
  const setError = useAuditStore((state) => state.setError);
  const setEvents = useAuditStore((state) => state.setEvents);
  const setDetections = useAuditStore((state) => state.setDetections);
  const setSnapshots = useAuditStore((state) => state.setSnapshots);
  const setSession = useAuditStore((state) => state.setSession);
  const storePlay = useAuditStore((state) => state.play);
  const storePause = useAuditStore((state) => state.pause);
  const storeReset = useAuditStore((state) => state.reset);
  const storeJumpToDetection = useAuditStore((state) => state.jumpToDetection);
  const storeJumpToTime = useAuditStore((state) => state.jumpToTime);
  const storeSetPlaybackSpeed = useAuditStore((state) => state.setPlaybackSpeed);
  const storeClearSession = useAuditStore((state) => state.clearSession);
  const storeSetPlaybackTime = useAuditStore((state) => state.setPlaybackTime);
  
  // State selectors
  const session = useAuditStore((state) => state.session);
  const events = useAuditStore((state) => state.events);
  const detections = useAuditStore((state) => state.detections);
  const snapshots = useAuditStore((state) => state.snapshots);
  const activeSnapshot = useAuditStore((state) => state.activeSnapshot);
  const playbackTime = useAuditStore((state) => state.playbackTime);
  const playbackSpeed = useAuditStore((state) => state.playbackSpeed);
  const isPlaying = useAuditStore((state) => state.isPlaying);
  const loading = useAuditStore((state) => state.loading);
  const error = useAuditStore((state) => state.error);
  const sessionDuration = useAuditStore((state) => state.sessionDuration);
  const totalAttempts = useAuditStore((state) => state.totalAttempts);
  const hintsUsed = useAuditStore((state) => state.hintsUsed);
  const detectionCount = useAuditStore((state) => state.detectionCount);
  const highestSeverity = useAuditStore((state) => state.highestSeverity);
  
  const addTelemetryEvent = useTelemetryStore((state) => state.addEvent);
  const playbackRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  
  // Load session data
  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel for efficiency
      const [eventsResult, detectionsResult, snapshotsResult] = await Promise.allSettled([
        auditService.getEvents(sessionId),
        auditService.getDetections(sessionId),
        auditService.getSnapshots(sessionId),
      ]);
      
      // Handle partial failures gracefully
      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value);
      }
      
      if (detectionsResult.status === 'fulfilled') {
        setDetections(detectionsResult.value);
      }
      
      if (snapshotsResult.status === 'fulfilled') {
        setSnapshots(snapshotsResult.value);
        
        // Calculate session from snapshots
        if (snapshotsResult.value.length > 0) {
          const startTime = snapshotsResult.value[0].timestamp;
          const endTime = snapshotsResult.value[snapshotsResult.value.length - 1].timestamp;
          
          setSession({
            sessionId,
            userId: 'unknown',
            challengeId: snapshotsResult.value[0].route.split('/').pop() || 'unknown',
            startTime,
            endTime,
            events: eventsResult.status === 'fulfilled' ? eventsResult.value : [],
            detections: detectionsResult.status === 'fulfilled' ? detectionsResult.value : [],
            snapshots: snapshotsResult.value,
          });
        }
      }
      
      // Check if all failed
      if (
        eventsResult.status === 'rejected' && 
        detectionsResult.status === 'rejected' && 
        snapshotsResult.status === 'rejected'
      ) {
        throw new Error('Failed to load session data');
      }
      
      // Track audit opened
      addTelemetryEvent({
        type: 'navigation',
        userId: 'audit-viewer',
        metadata: { 
          action: 'audit_opened', 
          sessionId,
        },
      });
      
      setLoading(false);
      
      if (autoPlay) {
        storePlay();
      }
    } catch (err) {
      // Sanitize error message - don't expose internal details
      setError('Unable to load session data. Please try again.');
      console.error('[Audit] Load error:', err);
    }
  }, [sessionId, autoPlay, setLoading, setError, setEvents, setDetections, setSnapshots, setSession, addTelemetryEvent, storePlay]);
  
  // Playback engine
  useEffect(() => {
    if (!isPlaying || !session) {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
      return;
    }
    
    const tick = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }
      
      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;
      
      // Apply playback speed - use refs to get current values
      const currentPlaybackTime = useAuditStore.getState().playbackTime;
      const currentPlaybackSpeed = useAuditStore.getState().playbackSpeed;
      const currentSessionDuration = useAuditStore.getState().sessionDuration;
      
      const newTime = currentPlaybackTime + (delta * currentPlaybackSpeed);
      
      // Check if we've reached the end
      if (newTime >= currentSessionDuration) {
        storeSetPlaybackTime(currentSessionDuration);
        storePause();
        
        // Track audit completion
        addTelemetryEvent({
          type: 'navigation',
          userId: 'audit-viewer',
          metadata: { action: 'audit_complete', sessionId },
        });
        return;
      }
      
      storeSetPlaybackTime(newTime);
      playbackRef.current = requestAnimationFrame(tick);
    };
    
    lastTickRef.current = 0;
    playbackRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, [isPlaying, session, sessionId, storeSetPlaybackTime, storePause, addTelemetryEvent]);
  
  // Load on mount
  useEffect(() => {
    loadSession();
    
    return () => {
      // Track exit
      addTelemetryEvent({
        type: 'navigation',
        userId: 'audit-viewer',
        metadata: { action: 'audit_exit', sessionId },
      });
      storeClearSession();
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Playback controls with telemetry
  const play = useCallback(() => {
    storePlay();
    addTelemetryEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_play', sessionId },
    });
  }, [storePlay, addTelemetryEvent, sessionId]);
  
  const pause = useCallback(() => {
    storePause();
    addTelemetryEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_pause', sessionId },
    });
  }, [storePause, addTelemetryEvent, sessionId]);
  
  const jumpToDetection = useCallback((detection: AuditDetection) => {
    storeJumpToDetection(detection);
    addTelemetryEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { 
        action: 'audit_jump', 
        sessionId,
        targetTime: detection.timestamp,
        ruleId: detection.ruleId,
      },
    });
  }, [storeJumpToDetection, addTelemetryEvent, sessionId]);
  
  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    storeSetPlaybackSpeed(speed);
    addTelemetryEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_speed_change', sessionId, speed },
    });
  }, [storeSetPlaybackSpeed, addTelemetryEvent, sessionId]);
  
  return {
    // State
    session,
    events,
    detections,
    snapshots,
    activeSnapshot,
    playbackTime,
    playbackSpeed,
    isPlaying,
    loading,
    error,
    
    // Metrics
    sessionDuration,
    totalAttempts,
    hintsUsed,
    detectionCount,
    highestSeverity,
    
    // Actions
    play,
    pause,
    reset: storeReset,
    jumpToDetection,
    jumpToTime: storeJumpToTime,
    setSpeed,
    reload: loadSession,
  };
}
