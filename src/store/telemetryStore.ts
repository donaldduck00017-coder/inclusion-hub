import { create } from 'zustand';
import type { TelemetryEvent, TelemetryEventType } from '@/types';
import { config } from '@/lib/config';

interface TelemetryState {
  // Queue
  eventQueue: TelemetryEvent[];
  
  // Session
  currentSessionId: string | null;
  sessionStartTime: number | null;
  
  // Stats
  eventsTracked: number;
  failedFlushCount: number;
  lastFlushTime: number | null;
  
  // State flags
  isEnabled: boolean;
  isPrivacyMode: boolean;
  
  // Actions
  addEvent: (event: Omit<TelemetryEvent, 'timestamp'>) => void;
  startSession: (sessionId: string) => void;
  endSession: () => void;
  flush: () => void;
  incrementFailedFlush: () => void;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  // Initial state
  eventQueue: [],
  currentSessionId: null,
  sessionStartTime: null,
  eventsTracked: 0,
  failedFlushCount: 0,
  lastFlushTime: null,
  isEnabled: config.features.telemetry && !config.killSwitches.disableTelemetry,
  isPrivacyMode: config.dataMinimization.enabled,

  // Add event to queue
  addEvent: (event) => {
    const state = get();
    
    // Skip if disabled
    if (!state.isEnabled) {
      return;
    }

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: state.currentSessionId || undefined,
    };

    set((state) => ({
      eventQueue: [...state.eventQueue, fullEvent],
      eventsTracked: state.eventsTracked + 1,
    }));

    // Auto-flush if queue is full
    if (get().eventQueue.length >= config.telemetry.batchSize) {
      get().flush();
    }
  },

  // Start a new session
  startSession: (sessionId) => {
    set({
      currentSessionId: sessionId,
      sessionStartTime: Date.now(),
    });
  },

  // End current session
  endSession: () => {
    set({
      currentSessionId: null,
      sessionStartTime: null,
    });
  },

  // Flush the event queue
  flush: () => {
    const state = get();
    
    if (state.eventQueue.length === 0) {
      return;
    }

    // In a real implementation, this would send to the telemetry service
    console.info(`[Telemetry] Flushing ${state.eventQueue.length} events`);

    set({
      eventQueue: [],
      lastFlushTime: Date.now(),
    });
  },

  // Increment failed flush counter
  incrementFailedFlush: () => {
    set((state) => ({
      failedFlushCount: state.failedFlushCount + 1,
    }));
  },

  // Enable/disable telemetry
  setEnabled: (enabled) => {
    set({ isEnabled: enabled });
  },

  // Reset store
  reset: () => {
    set({
      eventQueue: [],
      currentSessionId: null,
      sessionStartTime: null,
      eventsTracked: 0,
      failedFlushCount: 0,
      lastFlushTime: null,
    });
  },
}));

// Helper function to track common events
export const trackEvent = (
  type: TelemetryEventType,
  userId: string,
  metadata?: Record<string, unknown>
) => {
  useTelemetryStore.getState().addEvent({
    type,
    userId,
    metadata,
  });
};
