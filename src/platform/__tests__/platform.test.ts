/**
 * Platform Integration Tests
 * 
 * These tests verify the end-to-end request lifecycle:
 * Request → Auth → Policy → Service → Observe → Response
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Auth
  createSession,
  validateToken,
  clearAllSessions,
  validateCredentials,
  
  // Policy
  can,
  updateKillSwitches,
  
  // Router
  execute,
  clearServices,
  
  // Services
  initializeServices,
  
  // Observe
  getObservations,
  clearObservations,
} from '@/platform';

describe('Platform Request Lifecycle', () => {
  beforeEach(() => {
    // Reset all platform state
    clearAllSessions();
    clearServices();
    clearObservations();
    updateKillSwitches({
      disableTelemetry: false,
      disableAiTutor: false,
      readOnlyMode: false,
      emergencyShutdown: false,
    });
    
    // Re-register services
    initializeServices();
  });

  describe('Auth → Policy → Service flow', () => {
    it('should deny unauthenticated requests', async () => {
      const response = await execute({
        action: 'read',
        resource: 'challenge',
        payload: {},
      });

      expect(response.success).toBe(false);
      // Without a token, policy denies with FORBIDDEN (auth required)
      expect(response.error?.code).toBe('FORBIDDEN');
    });

    it('should allow authenticated requests with correct permissions', async () => {
      // Create a student session
      const { token } = createSession('user-1', 'student');
      
      // Students can read telemetry events
      const response = await execute({
        token,
        action: 'read',
        resource: 'telemetry-event',
        payload: {},
      });

      expect(response.success).toBe(true);
    });

    it('should deny requests without required permissions', async () => {
      // Create a student session
      const { token } = createSession('user-1', 'student');
      
      // Students cannot access SOC alerts
      const response = await execute({
        token,
        action: 'read',
        resource: 'soc-alert',
        payload: {},
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('FORBIDDEN');
    });

    it('should allow admin access to protected resources', async () => {
      // Create an admin session
      const { token } = createSession('admin-1', 'admin');
      
      // Admins can read telemetry
      const response = await execute({
        token,
        action: 'read',
        resource: 'telemetry-event',
        payload: {},
      });

      expect(response.success).toBe(true);
    });
  });

  describe('Policy Engine', () => {
    it('should return DENY for unauthenticated users', () => {
      const result = can(null, 'read', 'challenge', { timestamp: Date.now() });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Authentication required');
    });

    it('should return ALLOW for users with correct permissions', () => {
      const { identity } = createSession('user-1', 'student');
      
      const result = can(identity, 'read', 'challenge', { timestamp: Date.now() });
      expect(result.decision).toBe('ALLOW');
    });

    it('should enforce emergency shutdown', () => {
      updateKillSwitches({ emergencyShutdown: true });
      
      const { identity } = createSession('admin-1', 'admin');
      
      // Even admins blocked during shutdown (except health checks)
      const result = can(identity, 'read', 'challenge', { timestamp: Date.now() });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('emergency shutdown');
    });

    it('should allow health checks during emergency', () => {
      updateKillSwitches({ emergencyShutdown: true });
      
      const { identity } = createSession('admin-1', 'admin');
      
      // Health checks still work
      const result = can(identity, 'read', 'health-metrics', { timestamp: Date.now() });
      expect(result.decision).toBe('ALLOW');
    });

    it('should block writes in read-only mode', () => {
      updateKillSwitches({ readOnlyMode: true });
      
      const { identity } = createSession('admin-1', 'admin');
      
      const result = can(identity, 'write', 'challenge', { timestamp: Date.now() });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('read-only mode');
    });
  });

  describe('Token Management', () => {
    it('should create and validate tokens', () => {
      const { token, identity } = createSession('user-1', 'student');
      
      expect(token).toBeTruthy();
      expect(identity.userId).toBe('user-1');
      expect(identity.role).toBe('student');
      
      const validated = validateToken(token);
      expect(validated).not.toBeNull();
      expect(validated?.userId).toBe('user-1');
    });

    it('should reject invalid tokens', () => {
      const validated = validateToken('completely-invalid-token');
      expect(validated).toBeNull();
    });
  });

  describe('Credential Validation', () => {
    it('should validate correct credentials', async () => {
      const user = await validateCredentials({
        email: 'student@inclusionlab.io',
        password: 'student123',
      });
      
      expect(user).not.toBeNull();
      expect(user?.email).toBe('student@inclusionlab.io');
      expect(user?.role).toBe('student');
    });

    it('should reject invalid credentials', async () => {
      const user = await validateCredentials({
        email: 'student@inclusionlab.io',
        password: 'wrongpassword',
      });
      
      expect(user).toBeNull();
    });

    it('should never return password in user object', async () => {
      const user = await validateCredentials({
        email: 'student@inclusionlab.io',
        password: 'student123',
      });
      
      expect(user).not.toBeNull();
      expect((user as any).password).toBeUndefined();
    });
  });

  describe('Observation/Logging', () => {
    it('should log security events on auth failure', async () => {
      await execute({
        token: 'invalid-token',
        action: 'read',
        resource: 'challenge',
        payload: {},
      });

      const securityEvents = getObservations({ level: 'security' });
      expect(securityEvents.length).toBeGreaterThan(0);
      expect(securityEvents[0].action).toContain('auth_failed');
    });

    it('should log policy denials', async () => {
      const { token } = createSession('user-1', 'student');
      
      await execute({
        token,
        action: 'read',
        resource: 'soc-alert', // Students can't access
        payload: {},
      });

      const securityEvents = getObservations({ level: 'security' });
      const policyDenied = securityEvents.find(e => e.action === 'policy_denied');
      expect(policyDenied).toBeTruthy();
    });
  });

  describe('Telemetry Service E2E', () => {
    it('should track events through the full lifecycle', async () => {
      const { token } = createSession('user-1', 'student');
      
      // Start a session
      const startResponse = await execute<
        { challengeId: string },
        { sessionId: string }
      >({
        token,
        action: 'execute',
        resource: 'telemetry-session',
        payload: { challengeId: 'challenge-1' },
      });

      expect(startResponse.success).toBe(true);
      expect(startResponse.data?.sessionId).toBeTruthy();

      // Track an event
      const trackResponse = await execute({
        token,
        action: 'write',
        resource: 'telemetry-event',
        payload: {
          event: {
            type: 'challenge_start',
            timestamp: Date.now(),
            userId: 'user-1',
            metadata: { challengeId: 'challenge-1' },
          },
        },
      });

      expect(trackResponse.success).toBe(true);
    });
  });
});
