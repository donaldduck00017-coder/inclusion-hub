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
  const store = useAuditStore();
  const telemetry = useTelemetryStore();
  const playbackRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  
  // Load session data
  const loadSession = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      // Fetch all data in parallel for efficiency
      const [events, detections, snapshots] = await Promise.allSettled([
        auditService.getEvents(sessionId),
        auditService.getDetections(sessionId),
        auditService.getSnapshots(sessionId),
      ]);
      
      // Handle partial failures gracefully
      if (events.status === 'fulfilled') {
        store.setEvents(events.value);
      }
      
      if (detections.status === 'fulfilled') {
        store.setDetections(detections.value);
      }
      
      if (snapshots.status === 'fulfilled') {
        store.setSnapshots(snapshots.value);
        
        // Calculate session from snapshots
        if (snapshots.value.length > 0) {
          const startTime = snapshots.value[0].timestamp;
          const endTime = snapshots.value[snapshots.value.length - 1].timestamp;
          
          store.setSession({
            sessionId,
            userId: 'unknown',
            challengeId: snapshots.value[0].route.split('/').pop() || 'unknown',
            startTime,
            endTime,
            events: events.status === 'fulfilled' ? events.value : [],
            detections: detections.status === 'fulfilled' ? detections.value : [],
            snapshots: snapshots.value,
          });
        }
      }
      
      // Check if all failed
      if (
        events.status === 'rejected' && 
        detections.status === 'rejected' && 
        snapshots.status === 'rejected'
      ) {
        throw new Error('Failed to load session data');
      }
      
      // Track audit opened
      telemetry.addEvent({
        type: 'navigation',
        userId: 'audit-viewer',
        metadata: { 
          action: 'audit_opened', 
          sessionId,
        },
      });
      
      store.setLoading(false);
      
      if (autoPlay) {
        store.play();
      }
    } catch (error) {
      // Sanitize error message - don't expose internal details
      store.setError('Unable to load session data. Please try again.');
      console.error('[Audit] Load error:', error);
    }
  }, [sessionId, autoPlay, store, telemetry]);
  
  // Playback engine
  useEffect(() => {
    if (!store.isPlaying || !store.session) {
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
      
      // Apply playback speed
      const newTime = store.playbackTime + (delta * store.playbackSpeed);
      
      // Check if we've reached the end
      if (newTime >= store.sessionDuration) {
        store.setPlaybackTime(store.sessionDuration);
        store.pause();
        
        // Track audit completion
        telemetry.addEvent({
          type: 'navigation',
          userId: 'audit-viewer',
          metadata: { action: 'audit_complete', sessionId },
        });
        return;
      }
      
      store.setPlaybackTime(newTime);
      playbackRef.current = requestAnimationFrame(tick);
    };
    
    lastTickRef.current = 0;
    playbackRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, [store.isPlaying, store.session, store.playbackSpeed, sessionId, telemetry]);
  
  // Load on mount
  useEffect(() => {
    loadSession();
    
    return () => {
      // Track exit
      telemetry.addEvent({
        type: 'navigation',
        userId: 'audit-viewer',
        metadata: { action: 'audit_exit', sessionId },
      });
      store.clearSession();
    };
  }, [sessionId, loadSession, telemetry, store]);
  
  // Playback controls with telemetry
  const play = useCallback(() => {
    store.play();
    telemetry.addEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_play', sessionId },
    });
  }, [store, telemetry, sessionId]);
  
  const pause = useCallback(() => {
    store.pause();
    telemetry.addEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_pause', sessionId },
    });
  }, [store, telemetry, sessionId]);
  
  const jumpToDetection = useCallback((detection: AuditDetection) => {
    store.jumpToDetection(detection);
    telemetry.addEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { 
        action: 'audit_jump', 
        sessionId,
        targetTime: detection.timestamp,
        ruleId: detection.ruleId,
      },
    });
  }, [store, telemetry, sessionId]);
  
  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    store.setPlaybackSpeed(speed);
    telemetry.addEvent({
      type: 'navigation',
      userId: 'audit-viewer',
      metadata: { action: 'audit_speed_change', sessionId, speed },
    });
  }, [store, telemetry, sessionId]);
  
  return {
    // State
    session: store.session,
    events: store.events,
    detections: store.detections,
    snapshots: store.snapshots,
    activeSnapshot: store.activeSnapshot,
    playbackTime: store.playbackTime,
    playbackSpeed: store.playbackSpeed,
    isPlaying: store.isPlaying,
    loading: store.loading,
    error: store.error,
    
    // Metrics
    sessionDuration: store.sessionDuration,
    totalAttempts: store.totalAttempts,
    hintsUsed: store.hintsUsed,
    detectionCount: store.detectionCount,
    highestSeverity: store.highestSeverity,
    
    // Actions
    play,
    pause,
    reset: store.reset,
    jumpToDetection,
    jumpToTime: store.jumpToTime,
    setSpeed,
    reload: loadSession,
  };
}
