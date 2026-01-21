/**
 * Mock SOC Service
 * 
 * Simulates SOC operations for development and testing.
 * Generates mock alerts, sessions, and provides detection rule management.
 */

import type {
  SOCAlert,
  AlertSeverity,
  AlertStatus,
  AlertCategory,
  SessionSnapshot,
  DetectionRule,
  AnalystNote,
  UserRole,
} from '@/types';
import { defaultDetectionRules, detectionEngine } from './detectionEngine';

// Generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Hash user ID for privacy
const hashUserId = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `usr_${Math.abs(hash).toString(16).padStart(8, '0')}`;
};

// Mock data storage
const mockState = {
  alerts: [] as SOCAlert[],
  sessions: new Map<string, SessionSnapshot>(),
  notes: new Map<string, AnalystNote[]>(),
  rules: [...defaultDetectionRules],
};

// Generate mock alerts for demo
const generateMockAlerts = (): SOCAlert[] => {
  const severities: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const categories: AlertCategory[] = ['BEHAVIOR', 'SECURITY', 'PERFORMANCE', 'SYSTEM'];
  const statuses: AlertStatus[] = ['NEW', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'];
  
  const mockAlerts: SOCAlert[] = [
    {
      alertId: generateId('alert'),
      severity: 'HIGH',
      category: 'SECURITY',
      status: 'NEW',
      title: 'Repeated Failed Submissions',
      description: '5 failed submissions within 60 seconds detected',
      sessionId: 'session_demo_001',
      userId: hashUserId('student1'),
      challengeId: 'phish-001',
      triggeredBy: 'RULE_BRUTE_FORCE',
      timestamp: Date.now() - 5 * 60 * 1000,
      confidenceScore: 85,
      recommendedAction: 'Review submission pattern. Consider hint suggestion.',
    },
    {
      alertId: generateId('alert'),
      severity: 'MEDIUM',
      category: 'BEHAVIOR',
      status: 'NEW',
      title: 'Rapid Hint-to-Submit Pattern',
      description: 'Quick submission after viewing hints suggests copying',
      sessionId: 'session_demo_002',
      userId: hashUserId('student2'),
      challengeId: 'malware-001',
      triggeredBy: 'RULE_FAST_HINT_SUBMIT',
      timestamp: Date.now() - 15 * 60 * 1000,
      confidenceScore: 72,
      recommendedAction: 'Review for answer copying behavior.',
    },
    {
      alertId: generateId('alert'),
      severity: 'CRITICAL',
      category: 'SECURITY',
      status: 'NEW',
      title: 'Kill Switch Access Attempt',
      description: 'Unauthorized attempt to access kill switch controls',
      sessionId: 'session_demo_003',
      userId: hashUserId('student3'),
      triggeredBy: 'RULE_KILL_SWITCH',
      timestamp: Date.now() - 30 * 60 * 1000,
      confidenceScore: 95,
      recommendedAction: 'Immediate investigation required.',
    },
    {
      alertId: generateId('alert'),
      severity: 'LOW',
      category: 'BEHAVIOR',
      status: 'ACKNOWLEDGED',
      title: 'High Hint Dependency',
      description: '3 hints revealed in single challenge',
      sessionId: 'session_demo_004',
      userId: hashUserId('student4'),
      challengeId: 'crypto-001',
      triggeredBy: 'RULE_HINT_DEPENDENCY',
      timestamp: Date.now() - 45 * 60 * 1000,
      confidenceScore: 68,
      recommendedAction: 'Flag for learning support review.',
    },
    {
      alertId: generateId('alert'),
      severity: 'MEDIUM',
      category: 'SECURITY',
      status: 'RESOLVED',
      title: 'Restricted Feature Access',
      description: 'Attempted access to instructor-only features',
      sessionId: 'session_demo_005',
      userId: hashUserId('student5'),
      triggeredBy: 'RULE_RESTRICTED_ACCESS',
      timestamp: Date.now() - 60 * 60 * 1000,
      confidenceScore: 78,
      recommendedAction: 'Review access patterns.',
    },
  ];

  return mockAlerts;
};

// Generate mock session snapshots
const generateMockSessions = (): SessionSnapshot[] => {
  return [
    {
      sessionId: 'session_demo_001',
      userId: hashUserId('student1'),
      challengeId: 'phish-001',
      currentPage: '/challenges/phish-001',
      startTime: Date.now() - 20 * 60 * 1000,
      timeOnTask: 1200,
      attemptCount: 7,
      hintsUsed: 2,
      events: [],
      isActive: true,
    },
    {
      sessionId: 'session_demo_002',
      userId: hashUserId('student2'),
      challengeId: 'malware-001',
      currentPage: '/challenges/malware-001',
      startTime: Date.now() - 35 * 60 * 1000,
      timeOnTask: 1800,
      attemptCount: 3,
      hintsUsed: 3,
      events: [],
      isActive: true,
    },
    {
      sessionId: 'session_demo_003',
      userId: hashUserId('student3'),
      challengeId: undefined,
      currentPage: '/health',
      startTime: Date.now() - 40 * 60 * 1000,
      timeOnTask: 600,
      attemptCount: 0,
      hintsUsed: 0,
      events: [],
      isActive: false,
    },
  ];
};

// Initialize mock data
const initializeMockData = () => {
  if (mockState.alerts.length === 0) {
    mockState.alerts = generateMockAlerts();
    
    const sessions = generateMockSessions();
    sessions.forEach((s) => mockState.sessions.set(s.sessionId, s));
  }
};

export const mockSOCService = {
  // ============= Alert Operations =============
  
  async getAlerts(filters?: {
    severity?: AlertSeverity[];
    status?: AlertStatus[];
    category?: AlertCategory[];
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: SOCAlert[]; total: number }> {
    initializeMockData();
    await new Promise((r) => setTimeout(r, 100));

    let filtered = [...mockState.alerts];

    if (filters?.severity?.length) {
      filtered = filtered.filter((a) => filters.severity!.includes(a.severity));
    }
    if (filters?.status?.length) {
      filtered = filtered.filter((a) => filters.status!.includes(a.status));
    }
    if (filters?.category?.length) {
      filtered = filtered.filter((a) => filters.category!.includes(a.category));
    }

    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    return {
      alerts: filtered.slice(offset, offset + limit),
      total,
    };
  },

  async getAlert(alertId: string): Promise<SOCAlert | null> {
    initializeMockData();
    await new Promise((r) => setTimeout(r, 50));
    return mockState.alerts.find((a) => a.alertId === alertId) || null;
  },

  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 50));
    
    const alert = mockState.alerts.find((a) => a.alertId === alertId);
    if (alert) {
      alert.status = status;
      return true;
    }
    return false;
  },

  // ============= Session Operations =============

  async getActiveSessions(): Promise<SessionSnapshot[]> {
    initializeMockData();
    await new Promise((r) => setTimeout(r, 100));
    
    return Array.from(mockState.sessions.values()).filter((s) => s.isActive);
  },

  async getSession(sessionId: string): Promise<SessionSnapshot | null> {
    initializeMockData();
    await new Promise((r) => setTimeout(r, 50));
    
    return mockState.sessions.get(sessionId) || null;
  },

  // ============= Detection Rules =============

  async getDetectionRules(): Promise<DetectionRule[]> {
    await new Promise((r) => setTimeout(r, 50));
    return [...mockState.rules];
  },

  async updateDetectionRule(ruleId: string, updates: Partial<DetectionRule>): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 50));
    
    const ruleIndex = mockState.rules.findIndex((r) => r.id === ruleId);
    if (ruleIndex >= 0) {
      mockState.rules[ruleIndex] = { ...mockState.rules[ruleIndex], ...updates };
      detectionEngine.setRules(mockState.rules);
      return true;
    }
    return false;
  },

  async toggleRule(ruleId: string, enabled: boolean): Promise<boolean> {
    return this.updateDetectionRule(ruleId, { enabled });
  },

  // ============= Analyst Notes =============

  async addNote(
    alertId: string,
    content: string,
    authorId: string,
    authorRole: UserRole,
    tags: string[] = [],
    outcome?: AnalystNote['outcome']
  ): Promise<AnalystNote> {
    await new Promise((r) => setTimeout(r, 50));

    const note: AnalystNote = {
      id: generateId('note'),
      alertId,
      authorId: hashUserId(authorId),
      authorRole,
      content,
      tags,
      outcome,
      createdAt: Date.now(),
    };

    const existing = mockState.notes.get(alertId) || [];
    mockState.notes.set(alertId, [...existing, note]);

    return note;
  },

  async getNotes(alertId: string): Promise<AnalystNote[]> {
    await new Promise((r) => setTimeout(r, 50));
    return mockState.notes.get(alertId) || [];
  },

  // ============= Stats =============

  async getStats(): Promise<{
    totalAlerts: number;
    bySeverity: Record<AlertSeverity, number>;
    byStatus: Record<AlertStatus, number>;
    activeSessions: number;
    alertsLast24h: number;
  }> {
    initializeMockData();
    await new Promise((r) => setTimeout(r, 50));

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const bySeverity: Record<AlertSeverity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byStatus: Record<AlertStatus, number> = { NEW: 0, ACKNOWLEDGED: 0, ESCALATED: 0, RESOLVED: 0, IGNORED: 0 };
    let alertsLast24h = 0;

    for (const alert of mockState.alerts) {
      bySeverity[alert.severity]++;
      byStatus[alert.status]++;
      if (alert.timestamp >= oneDayAgo) alertsLast24h++;
    }

    const activeSessions = Array.from(mockState.sessions.values()).filter((s) => s.isActive).length;

    return {
      totalAlerts: mockState.alerts.length,
      bySeverity,
      byStatus,
      activeSessions,
      alertsLast24h,
    };
  },

  // ============= Reset =============

  reset() {
    mockState.alerts = [];
    mockState.sessions.clear();
    mockState.notes.clear();
    mockState.rules = [...defaultDetectionRules];
  },
};

export type MockSOCService = typeof mockSOCService;
