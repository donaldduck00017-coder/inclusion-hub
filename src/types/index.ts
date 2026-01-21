// Core entity types for Inclusion Lab

export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  skillLevel: number;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type ChallengeCategory = 
  | 'phishing'
  | 'malware'
  | 'network'
  | 'social-engineering'
  | 'cryptography'
  | 'web-security'
  | 'forensics';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ChallengeStatus = 'locked' | 'available' | 'in-progress' | 'completed';

// Validation rule types for challenge grading
export type ValidationRule = 
  | { type: 'exact'; answer: string }
  | { type: 'keywords'; keywords: string[]; minMatch?: number }
  | { type: 'regex'; pattern: string; flags?: string };

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  points: number;
  estimatedTime: number; 
  prerequisites: string[];
  status?: ChallengeStatus;
  completedAt?: string;
  attempts?: number;
  hints: string[];
  instructions: string;
  validation?: ValidationRule;
}

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  status: ChallengeStatus;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  hintsUsed: number;
  timeSpent: number; 
  score?: number;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  answer: string | string[];
  submittedAt: string;
  attemptId: string;
}

export interface SubmissionResult {
  success: boolean;
  correct: boolean;
  feedback: string;
  pointsEarned?: number;
  hintsAvailable?: number;
}

export type SkillArea = 
  | 'threat-detection'
  | 'incident-response'
  | 'security-analysis'
  | 'risk-assessment'
  | 'compliance'
  | 'network-defense';

export interface SkillBreakdown {
  area: SkillArea;
  level: number; 
  challengesCompleted: number;
  totalChallenges: number;
}

export interface UserProgress {
  userId: string;
  totalChallenges: number;
  completedChallenges: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  skills: SkillBreakdown[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'challenge_started' | 'challenge_completed' | 'hint_used' | 'achievement_earned';
  challengeId?: string;
  challengeTitle?: string;
  timestamp: string;
  details?: string;
}

// Telemetry types
export type TelemetryEventType = 
  | 'session_start'
  | 'session_end'
  | 'challenge_start'
  | 'hint_used'
  | 'submission_attempt'
  | 'time_on_task'
  | 'navigation'
  | 'focus_lost'
  | 'challenge_abandon';

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: number;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionRecording {
  sessionId: string;
  userId: string;
  challengeId: string;
  startTime: number;
  endTime: number;
  events: TelemetryEvent[];
  outcome: 'success' | 'failure' | 'abandoned';
  recordingConsent: boolean;
  dataRetentionDate: number;
  minimizationApplied: boolean;
}

// Health & System types
export type ServiceStatusType = 'up' | 'down' | 'degraded';
export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface ServiceStatus {
  name: string;
  status: ServiceStatusType;
  latency?: number;
  uptime?: number;
  lastCheck: number;
  errorRate?: number;
}

export interface KillSwitch {
  id: string;
  name: string;
  enabled: boolean;
  reason?: string;
  enabledBy?: string;
  enabledAt?: number;
}

export interface HealthMetrics {
  status: HealthStatus;
  timestamp: number;
  services: ServiceStatus[];
  telemetry: TelemetryHealth;
  api: ApiHealth;
  features: FeatureHealth;
}

export interface TelemetryHealth {
  queueSize: number;
  queueCapacity: number;
  eventsProcessed24h: number;
  failedFlushes: number;
  lastFlush: number;
  dataMinimizationActive: boolean;
}

export interface ApiHealth {
  version: string;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  requestRate: number;
  errorRate: number;
  deprecationWarnings: DeprecationNotice[];
}

export interface FeatureHealth {
  activeFlags: Record<string, boolean>;
  killSwitches: KillSwitch[];
  flagOverrides: number;
}

export interface DeprecationNotice {
  version: string;
  sunsetDate: string;
  migrationGuide: string;
  replacedBy: string;
}


export interface FeatureFlags {
  aiTutor: boolean;
  advancedChallenges: boolean;
  socDashboard: boolean;
  auditMode: boolean;
  telemetryExport: boolean;
  customChallenges: boolean;
  healthPanel: boolean;
}

// ============= SOC Dashboard Types =============

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertCategory = 'BEHAVIOR' | 'SECURITY' | 'PERFORMANCE' | 'SYSTEM';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED' | 'IGNORED';

export interface SOCAlert {
  alertId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  title: string;
  description: string;
  sessionId?: string;
  userId: string; 
  challengeId?: string;
  triggeredBy: string; 
  timestamp: number;
  confidenceScore: number; 
  recommendedAction: string;
  metadata?: Record<string, unknown>;
}

export interface AnalystNote {
  id: string;
  alertId: string;
  authorId: string;
  authorRole: UserRole;
  content: string;
  tags: string[];
  outcome?: 'false_positive' | 'learning_struggle' | 'policy_violation' | 'system_issue' | 'confirmed_threat';
  createdAt: number;
}

export type DetectionRuleType = 'threshold' | 'sequence' | 'behavioral_drift' | 'security';

export interface DetectionRule {
  id: string;
  name: string;
  type: DetectionRuleType;
  enabled: boolean;
  severity: AlertSeverity;
  category: AlertCategory;
  description: string;
  condition: DetectionCondition;
  recommendedAction: string;
}

export type DetectionCondition = 
  | ThresholdCondition 
  | SequenceCondition 
  | BehavioralDriftCondition 
  | SecurityCondition;

export interface ThresholdCondition {
  type: 'threshold';
  eventType: TelemetryEventType;
  threshold: number;
  windowSeconds: number;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
}

export interface SequenceCondition {
  type: 'sequence';
  events: TelemetryEventType[];
  maxWindowSeconds: number;
  strict?: boolean; 
}

export interface BehavioralDriftCondition {
  type: 'behavioral_drift';
  metric: 'time_on_task' | 'success_rate' | 'hint_usage';
  deviationThreshold: number; 
  baselineSource: 'cohort' | 'individual_history';
}

export interface SecurityCondition {
  type: 'security';
  pattern: 'role_escalation' | 'restricted_access' | 'telemetry_bypass' | 'kill_switch_attempt';
}

export interface NormalizedEvent {
  sessionId: string;
  userId: string; 
  role: UserRole;
  challengeId?: string;
  timestamp: number;
  eventType: TelemetryEventType | string;
  metadata: Record<string, unknown>;
}

export interface SessionSnapshot {
  sessionId: string;
  userId: string;
  challengeId?: string;
  currentPage: string;
  startTime: number;
  timeOnTask: number;
  attemptCount: number;
  hintsUsed: number;
  events: NormalizedEvent[];
  isActive: boolean;
}
