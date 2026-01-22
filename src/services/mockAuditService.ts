/**
 * Mock Audit Service
 * 
 * Provides simulated audit session data for development.
 * All data follows the backend contract specification.
 */

import { config } from '@/lib/config';
import type { 
  AuditSession,
  AuditTelemetryEvent,
  AuditDetection,
  AuditUISnapshot,
  AuditSessionSummary,
  AuditSessionListResponse,
} from '@/types/audit';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock session data
function generateMockSession(sessionId: string): AuditSession {
  const startTime = Date.now() - 600000; // 10 minutes ago
  const endTime = startTime + 480000; // 8 minute session
  
  return {
    sessionId,
    userId: 'user-001',
    challengeId: 'phish-001',
    startTime,
    endTime,
    events: generateMockEvents(startTime, endTime),
    detections: generateMockDetections(startTime, endTime),
    snapshots: generateMockSnapshots(startTime, endTime),
  };
}

function generateMockEvents(startTime: number, endTime: number): AuditTelemetryEvent[] {
  const duration = endTime - startTime;
  const events: AuditTelemetryEvent[] = [];
  
  // Session start
  events.push({
    id: 'evt-001',
    timestamp: startTime,
    type: 'session_start',
    payload: { challengeId: 'phish-001' },
  });
  
  // Challenge start
  events.push({
    id: 'evt-002',
    timestamp: startTime + 1000,
    type: 'challenge_start',
    payload: { challengeId: 'phish-001' },
  });
  
  // First hint
  events.push({
    id: 'evt-003',
    timestamp: startTime + 60000,
    type: 'hint_used',
    payload: { hintLevel: 1 },
  });
  
  // First submission attempt (wrong)
  events.push({
    id: 'evt-004',
    timestamp: startTime + 120000,
    type: 'submission_attempt',
    payload: { success: false, answer: 'suspicious.com' },
  });
  
  // Time on task heartbeats
  for (let i = 1; i <= 6; i++) {
    events.push({
      id: `evt-heartbeat-${i}`,
      timestamp: startTime + i * 60000,
      type: 'time_on_task',
      payload: { timeSpent: i * 60 },
    });
  }
  
  // Second hint
  events.push({
    id: 'evt-005',
    timestamp: startTime + 180000,
    type: 'hint_used',
    payload: { hintLevel: 2 },
  });
  
  // Navigation event
  events.push({
    id: 'evt-006',
    timestamp: startTime + 200000,
    type: 'navigation',
    payload: { from: '/challenges/phish-001', to: '/challenges' },
  });
  
  // Return navigation
  events.push({
    id: 'evt-007',
    timestamp: startTime + 220000,
    type: 'navigation',
    payload: { from: '/challenges', to: '/challenges/phish-001' },
  });
  
  // Focus lost
  events.push({
    id: 'evt-008',
    timestamp: startTime + 280000,
    type: 'focus_lost',
    payload: { duration: 15000 },
  });
  
  // Second submission (correct)
  events.push({
    id: 'evt-009',
    timestamp: startTime + 360000,
    type: 'submission_attempt',
    payload: { success: true, answer: 'phishing-example.com' },
  });
  
  // Session end
  events.push({
    id: 'evt-010',
    timestamp: endTime,
    type: 'session_end',
    payload: { outcome: 'success', duration: duration },
  });
  
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

function generateMockDetections(startTime: number, _endTime: number): AuditDetection[] {
  const detections: AuditDetection[] = [
    {
      ruleId: 'R-001',
      severity: 'low' as const,
      confidence: 0.75,
      message: 'Multiple hint requests within short timeframe',
      timestamp: startTime + 180000,
    },
    {
      ruleId: 'R-002',
      severity: 'medium' as const,
      confidence: 0.82,
      message: 'Submission pattern indicates potential struggling',
      timestamp: startTime + 120000,
    },
    {
      ruleId: 'R-003',
      severity: 'low' as const,
      confidence: 0.65,
      message: 'Extended focus loss detected during challenge',
      timestamp: startTime + 280000,
    },
  ];
  return detections.sort((a, b) => a.timestamp - b.timestamp);
}

function generateMockSnapshots(startTime: number, endTime: number): AuditUISnapshot[] {
  const snapshots: AuditUISnapshot[] = [];
  const duration = endTime - startTime;
  
  // Generate snapshots every 30 seconds
  for (let offset = 0; offset <= duration; offset += 30000) {
    const timestamp = startTime + offset;
    const progress = offset / duration;
    
    snapshots.push({
      timestamp,
      route: offset < 200000 || offset > 220000 
        ? '/challenges/phish-001' 
        : '/challenges',
      inputState: {
        answer: progress > 0.6 ? 'phishing-example.com' : 
                progress > 0.2 ? 'suspicious.com' : '',
      },
      scrollY: Math.floor(Math.random() * 300),
      environment: {
        id: 'env-phish-001',
        status: offset < 10000 ? 'starting' : 
                offset > duration - 10000 ? 'stopped' : 'ready',
        endpoint: 'http://localhost:8080',
        expiresAt: endTime + 300000, // 5 minutes after session end
      },
    });
  }
  
  return snapshots;
}

// Mock session list
const mockSessionList: AuditSessionSummary[] = [
  {
    sessionId: 'session-001',
    userId: 'user-001',
    userName: 'Alice Student',
    challengeId: 'phish-001',
    challengeTitle: 'Phishing Detection 101',
    startTime: Date.now() - 600000,
    endTime: Date.now() - 120000,
    outcome: 'success',
    totalAttempts: 2,
    hintsUsed: 2,
    detectionCount: 3,
    highestSeverity: 'medium',
  },
  {
    sessionId: 'session-002',
    userId: 'user-002',
    userName: 'Bob Student',
    challengeId: 'malware-001',
    challengeTitle: 'Malware Analysis Basics',
    startTime: Date.now() - 1800000,
    endTime: Date.now() - 900000,
    outcome: 'failure',
    totalAttempts: 5,
    hintsUsed: 3,
    detectionCount: 5,
    highestSeverity: 'high',
  },
  {
    sessionId: 'session-003',
    userId: 'user-003',
    userName: 'Charlie Student',
    challengeId: 'network-001',
    challengeTitle: 'Network Traffic Analysis',
    startTime: Date.now() - 3600000,
    endTime: Date.now() - 3000000,
    outcome: 'abandoned',
    totalAttempts: 1,
    hintsUsed: 0,
    detectionCount: 1,
    highestSeverity: 'low',
  },
];

export const mockAuditService = {
  /**
   * Get list of audit sessions
   */
  async getSessions(params?: {
    userId?: string;
    challengeId?: string;
    startDate?: number;
    limit?: number;
  }): Promise<AuditSessionListResponse> {
    await delay(config.mockDelay);
    
    let sessions = [...mockSessionList];
    
    if (params?.userId) {
      sessions = sessions.filter(s => s.userId === params.userId);
    }
    
    if (params?.challengeId) {
      sessions = sessions.filter(s => s.challengeId === params.challengeId);
    }
    
    if (params?.startDate) {
      sessions = sessions.filter(s => s.startTime >= params.startDate!);
    }
    
    const total = sessions.length;
    
    if (params?.limit) {
      sessions = sessions.slice(0, params.limit);
    }
    
    return { sessions, total };
  },
  
  /**
   * Get telemetry events for a session
   * GET /api/audit/sessions/:sessionId/events
   */
  async getEvents(sessionId: string): Promise<AuditTelemetryEvent[]> {
    await delay(config.mockDelay);
    
    const session = generateMockSession(sessionId);
    return session.events;
  },
  
  /**
   * Get detection signals for a session
   * GET /api/audit/sessions/:sessionId/detections
   */
  async getDetections(sessionId: string): Promise<AuditDetection[]> {
    await delay(config.mockDelay);
    
    const session = generateMockSession(sessionId);
    return session.detections;
  },
  
  /**
   * Get UI snapshots for a session
   * GET /api/audit/sessions/:sessionId/snapshots
   */
  async getSnapshots(sessionId: string): Promise<AuditUISnapshot[]> {
    await delay(config.mockDelay);
    
    const session = generateMockSession(sessionId);
    return session.snapshots;
  },
  
  /**
   * Get complete session data (convenience method)
   * Combines all three endpoints
   */
  async getSession(sessionId: string): Promise<AuditSession> {
    await delay(config.mockDelay);
    return generateMockSession(sessionId);
  },
};

export type MockAuditService = typeof mockAuditService;
