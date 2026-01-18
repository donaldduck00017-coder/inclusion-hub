/**
 * API Contract Documentation
 * Current Version: v2
 * Deprecated Versions: v1 (sunset date: 2026-06-01)
 */

import type { DeprecationNotice } from '@/types';

export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export interface ApiVersionConfig {
  baseUrl: string;
  deprecated: boolean;
  deprecationNotice?: DeprecationNotice;
}

// API Versioning Strategy
export const API_VERSIONS: Record<ApiVersion, ApiVersionConfig> = {
  [ApiVersion.V1]: {
    baseUrl: '/api/v1',
    deprecated: true,
    deprecationNotice: {
      version: 'v1',
      sunsetDate: '2026-06-01',
      migrationGuide: 'https://docs.inclusionlab.io/migration/v1-to-v2',
      replacedBy: 'v2',
    },
  },
  [ApiVersion.V2]: {
    baseUrl: '/api/v2',
    deprecated: false,
  },
};

/**
 * API Endpoints Documentation
 * 
 * V2 Endpoints (Current)
 * ----------------------
 * 
 * Authentication:
 * - POST /api/v2/auth/login
 *   Body: { email: string, password: string }
 *   Response: { token: string, user: User, expiresIn: number }
 * 
 * - POST /api/v2/auth/logout
 *   Headers: { Authorization: Bearer <token> }
 *   Response: { success: boolean }
 * 
 * - POST /api/v2/auth/refresh
 *   Body: { refreshToken: string }
 *   Response: { token: string, expiresIn: number }
 * 
 * Challenges:
 * - GET /api/v2/challenges?category={cat}&difficulty={diff}&page={n}&limit={m}
 *   Response: { challenges: Challenge[], total: number, page: number, hasMore: boolean }
 * 
 * - GET /api/v2/challenges/:id
 *   Response: Challenge
 * 
 * - POST /api/v2/challenges/:id/submit
 *   Body: { answer: string | string[], attemptId: string }
 *   Response: SubmissionResult
 * 
 * Progress & Analytics:
 * - GET /api/v2/progress
 *   Response: UserProgress
 * 
 * - GET /api/v2/progress/skills
 *   Response: SkillBreakdown[]
 * 
 * - GET /api/v2/progress/history?limit={n}
 *   Response: { attempts: ChallengeProgress[], total: number }
 * 
 * Telemetry:
 * - POST /api/v2/telemetry/events
 *   Body: { events: TelemetryEvent[], sessionId: string }
 *   Response: { accepted: number, rejected: number }
 * 
 * - POST /api/v2/telemetry/flush
 *   Body: { sessionId: string }
 *   Response: { success: boolean }
 * 
 * Audit:
 * - GET /api/v2/audit/sessions?userId={id}&challengeId={id}&startDate={date}
 *   Response: { sessions: SessionRecording[], total: number }
 * 
 * - GET /api/v2/audit/sessions/:id
 *   Response: SessionRecording
 * 
 * Health & System:
 * - GET /api/v2/health
 *   Response: HealthMetrics
 * 
 * - GET /api/v2/health/services
 *   Response: { services: ServiceStatus[] }
 * 
 * Admin:
 * - POST /api/v2/admin/kill-switch
 *   Body: { switchId: string, enabled: boolean, reason?: string }
 *   Response: { success: boolean, currentState: KillSwitch }
 * 
 * - GET /api/v2/admin/kill-switches
 *   Response: { switches: KillSwitch[] }
 */

// Helper to get current API configuration
export function getApiConfig(version: string): ApiVersionConfig {
  const apiVersion = version === 'v1' ? ApiVersion.V1 : ApiVersion.V2;
  return API_VERSIONS[apiVersion];
}

// Check if current version is deprecated
export function isVersionDeprecated(version: string): boolean {
  const config = getApiConfig(version);
  return config.deprecated;
}

// Get deprecation notice if applicable
export function getDeprecationNotice(version: string): DeprecationNotice | null {
  const config = getApiConfig(version);
  return config.deprecationNotice || null;
}
