import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';

export const useChallengeSession = (challengeId: string, userId: string) => {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const { addEvent, startSession, endSession, isEnabled } = useTelemetryStore();

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Track submission attempt (metadata only, no raw answers)
  const trackSubmission = useCallback((answerLength: number, attemptNumber: number) => {
    if (!sessionIdRef.current || !isEnabled) return;
    
    addEvent({
      type: 'submission_attempt',
      userId,
      sessionId: sessionIdRef.current,
      metadata: {
        challengeId,
        answerLength,
        attemptNumber,
      },
    });
  }, [addEvent, challengeId, userId, isEnabled]);

  // Track hint usage
  const trackHintUsed = useCallback((hintLevel: number) => {
    if (!sessionIdRef.current || !isEnabled) return;
    
    addEvent({
      type: 'hint_used',
      userId,
      sessionId: sessionIdRef.current,
      metadata: {
        challengeId,
        hintLevel,
      },
    });
  }, [addEvent, challengeId, userId, isEnabled]);

  // Track time on task
  const trackTimeOnTask = useCallback(() => {
    if (!sessionIdRef.current || !isEnabled) return;
    
    const duration = Date.now() - startTimeRef.current;
    
    addEvent({
      type: 'time_on_task',
      userId,
      sessionId: sessionIdRef.current,
      metadata: {
        challengeId,
        durationMs: duration,
      },
    });
  }, [addEvent, challengeId, userId, isEnabled]);

  // Session lifecycle
  useEffect(() => {
    if (!isEnabled) return;
    
    // Start session
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;
    startTimeRef.current = Date.now();
    
    startSession(sessionId);
    
    // Fire session start event
    addEvent({
      type: 'challenge_start',
      userId,
      sessionId,
      metadata: {
        challengeId,
      },
    });

    // Cleanup: end session
    return () => {
      const duration = Date.now() - startTimeRef.current;
      
      addEvent({
        type: 'session_end',
        userId,
        sessionId: sessionIdRef.current!,
        metadata: {
          challengeId,
          durationMs: duration,
        },
      });
      
      endSession();
    };
  }, [challengeId, userId, isEnabled, addEvent, startSession, endSession, generateSessionId]);

  return {
    sessionId: sessionIdRef.current,
    trackSubmission,
    trackHintUsed,
    trackTimeOnTask,
    isEnabled,
  };
};
