import { config } from '@/lib/config';
import type { TelemetryEvent, SessionRecording } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique session ID
const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Hash user ID for privacy mode
const hashUserId = (userId: string): string => {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `anon-${Math.abs(hash).toString(16)}`;
};

// In-memory storage for mock telemetry
const telemetryState = {
  eventQueue: [] as TelemetryEvent[],
  sessions: new Map<string, SessionRecording>(),
  currentSessionId: null as string | null,
  eventsProcessed: 0,
  failedFlushes: 0,
  lastFlushTime: Date.now(),
};

export const mockTelemetryService = {
  // Track a single event
  async trackEvent(event: TelemetryEvent): Promise<void> {
    // Check kill switch
    if (config.killSwitches.disableTelemetry) {
      console.info('[Telemetry] Disabled via kill switch - event dropped');
      return;
    }

    // Apply data minimization if enabled
    const sanitizedEvent = config.dataMinimization.enabled
      ? {
          ...event,
          userId: hashUserId(event.userId),
          metadata: config.dataMinimization.anonymizeHints
            ? { ...event.metadata, hintContent: undefined }
            : event.metadata,
        }
      : event;

    telemetryState.eventQueue.push(sanitizedEvent);

    // Auto-flush if queue is full
    if (telemetryState.eventQueue.length >= config.telemetry.batchSize) {
      await this.flush();
    }
  },

  // Track multiple events at once
  async trackEvents(events: TelemetryEvent[]): Promise<{ accepted: number; rejected: number }> {
    if (config.killSwitches.disableTelemetry) {
      return { accepted: 0, rejected: events.length };
    }

    let accepted = 0;
    let rejected = 0;

    for (const event of events) {
      try {
        await this.trackEvent(event);
        accepted++;
      } catch {
        rejected++;
      }
    }

    return { accepted, rejected };
  },

  // Start a new telemetry session
  async startSession(userId: string, challengeId: string): Promise<string> {
    await delay(config.mockDelay);

    // Check if session recording is disabled
    if (config.dataMinimization.enabled && config.dataMinimization.disableSessionRecording) {
      console.info('[Telemetry] Session recording disabled in privacy mode');
      return 'disabled';
    }

    const sessionId = generateSessionId();
    telemetryState.currentSessionId = sessionId;

    const session: SessionRecording = {
      sessionId,
      userId: config.dataMinimization.enabled ? hashUserId(userId) : userId,
      challengeId,
      startTime: Date.now(),
      endTime: 0,
      events: [],
      outcome: 'abandoned',
      recordingConsent: true,
      dataRetentionDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      minimizationApplied: config.dataMinimization.enabled,
    };

    telemetryState.sessions.set(sessionId, session);

    // Track session start event
    await this.trackEvent({
      type: 'session_start',
      timestamp: Date.now(),
      userId,
      sessionId,
      metadata: { challengeId },
    });

    return sessionId;
  },

  // End a telemetry session
  async endSession(
    sessionId: string,
    outcome: 'success' | 'failure' | 'abandoned'
  ): Promise<void> {
    await delay(config.mockDelay);

    const session = telemetryState.sessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      session.outcome = outcome;

      // Track session end event
      await this.trackEvent({
        type: 'session_end',
        timestamp: Date.now(),
        userId: session.userId,
        sessionId,
        metadata: {
          duration: session.endTime - session.startTime,
          outcome,
        },
      });
    }

    if (telemetryState.currentSessionId === sessionId) {
      telemetryState.currentSessionId = null;
    }
  },

  // Flush event queue
  async flush(): Promise<{ success: boolean; eventsFlushed: number }> {
    await delay(config.mockDelay);

    const eventsToFlush = telemetryState.eventQueue.length;

    // Simulate occasional flush failure (5% chance)
    if (Math.random() < 0.05) {
      telemetryState.failedFlushes++;
      return { success: false, eventsFlushed: 0 };
    }

    // Clear queue and update stats
    telemetryState.eventsProcessed += eventsToFlush;
    telemetryState.eventQueue = [];
    telemetryState.lastFlushTime = Date.now();

    return { success: true, eventsFlushed: eventsToFlush };
  },

  // Get current queue status
  getQueueStatus(): {
    queueSize: number;
    queueCapacity: number;
    failedFlushes: number;
    lastFlushTime: number;
  } {
    return {
      queueSize: telemetryState.eventQueue.length,
      queueCapacity: config.telemetry.batchSize * 10,
      failedFlushes: telemetryState.failedFlushes,
      lastFlushTime: telemetryState.lastFlushTime,
    };
  },

  // Get sessions for audit (filtered)
  async getSessions(params?: {
    userId?: string;
    challengeId?: string;
    startDate?: number;
    limit?: number;
  }): Promise<{ sessions: SessionRecording[]; total: number }> {
    await delay(config.mockDelay);

    let sessions = Array.from(telemetryState.sessions.values());

    if (params?.userId) {
      sessions = sessions.filter((s) => s.userId === params.userId);
    }

    if (params?.challengeId) {
      sessions = sessions.filter((s) => s.challengeId === params.challengeId);
    }

    if (params?.startDate) {
      sessions = sessions.filter((s) => s.startTime >= params.startDate!);
    }

    const total = sessions.length;

    if (params?.limit) {
      sessions = sessions.slice(0, params.limit);
    }

    return { sessions, total };
  },

  // Get a specific session
  async getSession(sessionId: string): Promise<SessionRecording | null> {
    await delay(config.mockDelay);
    return telemetryState.sessions.get(sessionId) || null;
  },

  // Clear all telemetry data (for testing)
  reset(): void {
    telemetryState.eventQueue = [];
    telemetryState.sessions.clear();
    telemetryState.currentSessionId = null;
    telemetryState.eventsProcessed = 0;
    telemetryState.failedFlushes = 0;
    telemetryState.lastFlushTime = Date.now();
  },
};

export type MockTelemetryService = typeof mockTelemetryService;
