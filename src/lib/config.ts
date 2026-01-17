// Environment configuration for the Inclusion Lab platform

export const config = {
  isDevelopment: import.meta.env.DEV,
  apiVersion: import.meta.env.VITE_API_VERSION || 'v2',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'mock',
  mockDelay: 300,

  // Feature toggles
  features: {
    telemetry: import.meta.env.VITE_ENABLE_TELEMETRY !== 'false',
    aiTutor: import.meta.env.VITE_ENABLE_AI_TUTOR !== 'false',
    auditMode: import.meta.env.VITE_ENABLE_AUDIT !== 'false',
  },

  // Kill switches (override feature flags)
  killSwitches: {
    disableTelemetry: false,
    disableAiTutor: false,
    readOnlyMode: false,
    emergencyShutdown: false,
  },

  // Privacy modes
  dataMinimization: {
    enabled: import.meta.env.VITE_DATA_MINIMIZATION === 'true',
    aggregateOnly: true,
    disableSessionRecording: true,
    anonymizeHints: true,
  },

  // Telemetry
  telemetry: {
    endpoint: '/telemetry/events',
    batchSize: 50,
    flushInterval: 30000,
    retryAttempts: 3,
  },
};

export type Config = typeof config;
