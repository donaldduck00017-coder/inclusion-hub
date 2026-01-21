/**
 * Detection Engine
 * 
 * Evaluates telemetry events against detection rules to generate alerts.
 * This is the "brain" of the SOC system - it detects behavioral patterns,
 * not correctness.
 */

import type {
  TelemetryEvent,
  DetectionRule,
  SOCAlert,
  AlertSeverity,
  NormalizedEvent,
  ThresholdCondition,
  SequenceCondition,
  SecurityCondition,
  UserRole,
} from '@/types';

// Simple hash function for user IDs (privacy compliance)
const hashUserId = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `usr_${Math.abs(hash).toString(16).padStart(8, '0')}`;
};

// Generate unique alert ID
const generateAlertId = (): string => {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Default detection rules
 * These simulate real SOC detection logic
 */
export const defaultDetectionRules: DetectionRule[] = [
  // Threshold Rules
  {
    id: 'RULE_BRUTE_FORCE',
    name: 'Brute Force Submission',
    type: 'threshold',
    enabled: true,
    severity: 'MEDIUM',
    category: 'BEHAVIOR',
    description: 'Multiple failed submissions in short time window',
    condition: {
      type: 'threshold',
      eventType: 'submission_attempt',
      threshold: 5,
      windowSeconds: 60,
      operator: 'gte',
    },
    recommendedAction: 'Review submission pattern. Consider hint suggestion.',
  },
  {
    id: 'RULE_HINT_DEPENDENCY',
    name: 'High Hint Dependency',
    type: 'threshold',
    enabled: true,
    severity: 'LOW',
    category: 'BEHAVIOR',
    description: 'Multiple hints revealed in single challenge',
    condition: {
      type: 'threshold',
      eventType: 'hint_used',
      threshold: 3,
      windowSeconds: 300,
      operator: 'gte',
    },
    recommendedAction: 'Flag for learning support review.',
  },
  {
    id: 'RULE_FOCUS_LOSS',
    name: 'Frequent Focus Loss',
    type: 'threshold',
    enabled: true,
    severity: 'LOW',
    category: 'BEHAVIOR',
    description: 'User frequently losing focus during challenge',
    condition: {
      type: 'threshold',
      eventType: 'focus_lost',
      threshold: 5,
      windowSeconds: 120,
      operator: 'gte',
    },
    recommendedAction: 'Monitor for engagement issues.',
  },
  // Sequence Rules
  {
    id: 'RULE_FAST_HINT_SUBMIT',
    name: 'Rapid Hint-to-Submit',
    type: 'sequence',
    enabled: true,
    severity: 'MEDIUM',
    category: 'BEHAVIOR',
    description: 'Quick submission after viewing hints suggests copying',
    condition: {
      type: 'sequence',
      events: ['hint_used', 'hint_used', 'submission_attempt'],
      maxWindowSeconds: 30,
    },
    recommendedAction: 'Review for answer copying behavior.',
  },
  {
    id: 'RULE_CHALLENGE_SKIP',
    name: 'Challenge Abandonment Pattern',
    type: 'sequence',
    enabled: true,
    severity: 'LOW',
    category: 'BEHAVIOR',
    description: 'Started challenge but abandoned quickly',
    condition: {
      type: 'sequence',
      events: ['challenge_start', 'challenge_abandon'],
      maxWindowSeconds: 60,
    },
    recommendedAction: 'Track for skill gap analysis.',
  },
  // Security Rules
  {
    id: 'RULE_ROLE_ESCALATION',
    name: 'Role Escalation Attempt',
    type: 'security',
    enabled: true,
    severity: 'HIGH',
    category: 'SECURITY',
    description: 'Attempted access to elevated role features',
    condition: {
      type: 'security',
      pattern: 'role_escalation',
    },
    recommendedAction: 'Investigate potential security breach.',
  },
  {
    id: 'RULE_RESTRICTED_ACCESS',
    name: 'Restricted Feature Access',
    type: 'security',
    enabled: true,
    severity: 'MEDIUM',
    category: 'SECURITY',
    description: 'Attempted access to restricted features',
    condition: {
      type: 'security',
      pattern: 'restricted_access',
    },
    recommendedAction: 'Review access patterns.',
  },
  {
    id: 'RULE_KILL_SWITCH',
    name: 'Kill Switch Access Attempt',
    type: 'security',
    enabled: true,
    severity: 'CRITICAL',
    category: 'SECURITY',
    description: 'Unauthorized kill switch manipulation attempt',
    condition: {
      type: 'security',
      pattern: 'kill_switch_attempt',
    },
    recommendedAction: 'Immediate investigation required.',
  },
];

/**
 * Detection Engine class
 * Evaluates events against rules and generates alerts
 */
class DetectionEngine {
  private rules: DetectionRule[] = defaultDetectionRules;
  private eventBuffer: Map<string, NormalizedEvent[]> = new Map();
  private alertCallback?: (alert: SOCAlert) => void;

  constructor() {
    // Clean old events periodically
    setInterval(() => this.cleanOldEvents(), 60000);
  }

  /**
   * Set callback for when alerts are generated
   */
  onAlert(callback: (alert: SOCAlert) => void) {
    this.alertCallback = callback;
  }

  /**
   * Normalize a telemetry event for processing
   */
  normalizeEvent(
    event: TelemetryEvent,
    role: UserRole = 'student'
  ): NormalizedEvent {
    return {
      sessionId: event.sessionId || 'unknown',
      userId: hashUserId(event.userId),
      role,
      challengeId: event.metadata?.challengeId as string | undefined,
      timestamp: event.timestamp,
      eventType: event.type,
      metadata: event.metadata || {},
    };
  }

  /**
   * Process an incoming event
   */
  processEvent(event: TelemetryEvent, role: UserRole = 'student'): SOCAlert[] {
    const normalized = this.normalizeEvent(event, role);
    const sessionKey = normalized.sessionId;

    // Add to buffer
    if (!this.eventBuffer.has(sessionKey)) {
      this.eventBuffer.set(sessionKey, []);
    }
    this.eventBuffer.get(sessionKey)!.push(normalized);

    // Evaluate all enabled rules
    const alerts: SOCAlert[] = [];
    for (const rule of this.rules.filter((r) => r.enabled)) {
      const alert = this.evaluateRule(rule, normalized, sessionKey);
      if (alert) {
        alerts.push(alert);
        this.alertCallback?.(alert);
      }
    }

    return alerts;
  }

  /**
   * Evaluate a single rule against current state
   */
  private evaluateRule(
    rule: DetectionRule,
    event: NormalizedEvent,
    sessionKey: string
  ): SOCAlert | null {
    const events = this.eventBuffer.get(sessionKey) || [];

    switch (rule.condition.type) {
      case 'threshold':
        return this.evaluateThreshold(rule, event, events);
      case 'sequence':
        return this.evaluateSequence(rule, event, events);
      case 'security':
        return this.evaluateSecurity(rule, event);
      default:
        return null;
    }
  }

  /**
   * Evaluate threshold-based rules
   */
  private evaluateThreshold(
    rule: DetectionRule,
    event: NormalizedEvent,
    events: NormalizedEvent[]
  ): SOCAlert | null {
    const condition = rule.condition as ThresholdCondition;

    // Only evaluate if event type matches
    if (event.eventType !== condition.eventType) {
      return null;
    }

    const windowStart = Date.now() - condition.windowSeconds * 1000;
    const matchingEvents = events.filter(
      (e) => e.eventType === condition.eventType && e.timestamp >= windowStart
    );

    const count = matchingEvents.length;
    let triggered = false;

    switch (condition.operator) {
      case 'gt':
        triggered = count > condition.threshold;
        break;
      case 'gte':
        triggered = count >= condition.threshold;
        break;
      case 'lt':
        triggered = count < condition.threshold;
        break;
      case 'lte':
        triggered = count <= condition.threshold;
        break;
      case 'eq':
        triggered = count === condition.threshold;
        break;
    }

    if (triggered) {
      return this.createAlert(rule, event, {
        eventCount: count,
        windowSeconds: condition.windowSeconds,
      });
    }

    return null;
  }

  /**
   * Evaluate sequence-based rules
   */
  private evaluateSequence(
    rule: DetectionRule,
    event: NormalizedEvent,
    events: NormalizedEvent[]
  ): SOCAlert | null {
    const condition = rule.condition as SequenceCondition;
    const requiredSequence = condition.events;

    // Only check when we receive the last event in the sequence
    if (event.eventType !== requiredSequence[requiredSequence.length - 1]) {
      return null;
    }

    const windowStart = Date.now() - condition.maxWindowSeconds * 1000;
    const recentEvents = events
      .filter((e) => e.timestamp >= windowStart)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Check if sequence exists in recent events
    let seqIndex = 0;
    for (const e of recentEvents) {
      if (e.eventType === requiredSequence[seqIndex]) {
        seqIndex++;
        if (seqIndex === requiredSequence.length) {
          return this.createAlert(rule, event, {
            sequence: requiredSequence,
            windowSeconds: condition.maxWindowSeconds,
          });
        }
      } else if (condition.strict) {
        seqIndex = 0; // Reset if strict mode
      }
    }

    return null;
  }

  /**
   * Evaluate security-based rules
   */
  private evaluateSecurity(
    rule: DetectionRule,
    event: NormalizedEvent
  ): SOCAlert | null {
    const condition = rule.condition as SecurityCondition;

    // Check for security patterns in metadata
    const securityPatterns: Record<string, (e: NormalizedEvent) => boolean> = {
      role_escalation: (e) =>
        e.metadata?.attemptedRole !== undefined ||
        e.eventType === 'navigation' && (e.metadata?.restrictedAccess as boolean),
      restricted_access: (e) =>
        (e.metadata?.restrictedRoute as boolean) === true ||
        (e.metadata?.accessDenied as boolean) === true,
      kill_switch_attempt: (e) =>
        (e.metadata?.killSwitchAccess as boolean) === true,
      telemetry_bypass: (e) =>
        (e.metadata?.telemetryBypass as boolean) === true,
    };

    const checker = securityPatterns[condition.pattern];
    if (checker && checker(event)) {
      return this.createAlert(rule, event, {
        pattern: condition.pattern,
      });
    }

    return null;
  }

  /**
   * Create an alert from a triggered rule
   */
  private createAlert(
    rule: DetectionRule,
    event: NormalizedEvent,
    triggerDetails: Record<string, unknown>
  ): SOCAlert {
    // Calculate confidence based on rule type and trigger details
    let confidence = 70;
    if (rule.severity === 'CRITICAL') confidence = 90;
    if (rule.severity === 'HIGH') confidence = 80;
    if (rule.type === 'security') confidence += 10;

    return {
      alertId: generateAlertId(),
      severity: rule.severity,
      category: rule.category,
      status: 'NEW',
      title: rule.name,
      description: rule.description,
      sessionId: event.sessionId,
      userId: event.userId,
      challengeId: event.challengeId,
      triggeredBy: rule.id,
      timestamp: Date.now(),
      confidenceScore: Math.min(100, confidence),
      recommendedAction: rule.recommendedAction,
      metadata: triggerDetails,
    };
  }

  /**
   * Clean old events from buffer
   */
  private cleanOldEvents() {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const cutoff = Date.now() - maxAge;

    this.eventBuffer.forEach((events, key) => {
      const filtered = events.filter((e) => e.timestamp >= cutoff);
      if (filtered.length === 0) {
        this.eventBuffer.delete(key);
      } else {
        this.eventBuffer.set(key, filtered);
      }
    });
  }

  /**
   * Get all configured rules
   */
  getRules(): DetectionRule[] {
    return [...this.rules];
  }

  /**
   * Update rules
   */
  setRules(rules: DetectionRule[]) {
    this.rules = rules;
  }

  /**
   * Get event buffer for a session
   */
  getSessionEvents(sessionId: string): NormalizedEvent[] {
    return this.eventBuffer.get(sessionId) || [];
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.eventBuffer.keys());
  }
}

// Singleton instance
export const detectionEngine = new DetectionEngine();
export type { DetectionEngine };
