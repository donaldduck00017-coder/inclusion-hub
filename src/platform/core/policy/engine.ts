/**
 * Policy Engine
 * 
 * Central authority for access control decisions.
 * Every service request must pass through this engine.
 * 
 * ARCHITECTURE:
 * - All policy decisions are logged for audit
 * - Decisions are deterministic given the same inputs
 * - No side effects - pure decision making
 * 
 * USAGE:
 *   const result = can(identity, 'read', 'challenge', context);
 *   if (result.decision === 'DENY') {
 *     throw new ForbiddenError(result.reason);
 *   }
 */

import type { 
  Identity, 
  Action, 
  Resource, 
  PolicyContext, 
  PolicyResult,
  KillSwitchState,
  Permission,
} from '../types';
import { hasPermission, isRoleAtLeast } from './permissions';

// ============= Kill Switch State =============

let killSwitches: KillSwitchState = {
  disableTelemetry: false,
  disableAiTutor: false,
  readOnlyMode: false,
  emergencyShutdown: false,
};

export function updateKillSwitches(state: Partial<KillSwitchState>): void {
  killSwitches = { ...killSwitches, ...state };
}

export function getKillSwitches(): KillSwitchState {
  return { ...killSwitches };
}

// ============= Action-to-Permission Mapping =============

const ACTION_PERMISSION_MAP: Record<Resource, Record<Action, Permission | null>> = {
  challenge: {
    read: 'challenges:view',
    write: 'challenges:create',
    delete: 'challenges:delete',
    execute: 'challenges:submit',
    admin: 'admin:users',
  },
  submission: {
    read: 'challenges:view',
    write: 'challenges:submit',
    delete: null, // Not allowed
    execute: 'challenges:submit',
    admin: 'admin:users',
  },
  progress: {
    read: 'progress:view',
    write: null, // System-managed
    delete: null,
    execute: null,
    admin: 'admin:users',
  },
  hint: {
    read: 'hints:use',
    write: null,
    delete: null,
    execute: 'hints:use',
    admin: 'admin:users',
  },
  'soc-alert': {
    read: 'soc:view',
    write: 'soc:manage',
    delete: 'soc:manage',
    execute: 'soc:manage',
    admin: 'admin:users',
  },
  'audit-session': {
    read: 'audit:view',
    write: null, // Immutable
    delete: null,
    execute: 'audit:replay',
    admin: 'admin:users',
  },
  'health-metrics': {
    read: 'health:view',
    write: 'health:manage',
    delete: null,
    execute: 'health:manage',
    admin: 'admin:kill-switches',
  },
  'kill-switch': {
    read: 'health:view',
    write: 'admin:kill-switches',
    delete: null,
    execute: 'admin:kill-switches',
    admin: 'admin:kill-switches',
  },
  user: {
    read: 'admin:users',
    write: 'admin:users',
    delete: 'admin:users',
    execute: null,
    admin: 'admin:users',
  },
  'telemetry-event': {
    read: 'telemetry:view',
    write: 'telemetry:view', // All authenticated users can write telemetry events
    delete: null,
    execute: null,
    admin: 'telemetry:export',
  },
  'telemetry-session': {
    read: 'telemetry:view',
    write: 'telemetry:view', // All authenticated users can manage their sessions
    delete: null,
    execute: 'telemetry:view', // Start session - available to all
    admin: 'telemetry:export',
  },
};

// ============= Policy Rules =============

interface PolicyRule {
  name: string;
  evaluate: (identity: Identity, action: Action, resource: Resource, context: PolicyContext) => PolicyResult | null;
}

const policyRules: PolicyRule[] = [
  // Rule 1: Emergency shutdown blocks everything except health checks
  {
    name: 'emergency-shutdown',
    evaluate: (identity, action, resource) => {
      if (killSwitches.emergencyShutdown && resource !== 'health-metrics') {
        return {
          decision: 'DENY',
          reason: 'System is in emergency shutdown mode',
          auditLog: true,
        };
      }
      return null;
    },
  },

  // Rule 2: Read-only mode blocks writes
  {
    name: 'read-only-mode',
    evaluate: (identity, action, resource) => {
      if (killSwitches.readOnlyMode && ['write', 'delete', 'execute'].includes(action)) {
        // Admins can still manage health
        if (identity.role === 'admin' && resource === 'health-metrics') {
          return null;
        }
        return {
          decision: 'DENY',
          reason: 'System is in read-only mode',
          auditLog: true,
        };
      }
      return null;
    },
  },

  // Rule 3: Telemetry disabled
  {
    name: 'telemetry-disabled',
    evaluate: (_identity, _action, resource) => {
      if (killSwitches.disableTelemetry && 
          (resource === 'telemetry-event' || resource === 'telemetry-session')) {
        return {
          decision: 'DENY',
          reason: 'Telemetry is disabled',
          auditLog: false,
        };
      }
      return null;
    },
  },

  // Rule 4: Owner-based access for progress
  {
    name: 'progress-owner-access',
    evaluate: (identity, action, resource, context) => {
      if (resource === 'progress' && action === 'read') {
        // Users can view their own progress
        if (context.resourceOwnerId === identity.userId) {
          return { decision: 'ALLOW', reason: 'Owner access' };
        }
        // Instructors can view class progress
        if (isRoleAtLeast(identity.role, 'instructor') && hasPermission(identity.role, 'progress:view-class')) {
          return { decision: 'ALLOW', reason: 'Instructor class access' };
        }
        // Admins can view all
        if (identity.role === 'admin' && hasPermission(identity.role, 'progress:view-all')) {
          return { decision: 'ALLOW', reason: 'Admin access' };
        }
      }
      return null;
    },
  },

  // Rule 5: Audit sessions are read-only
  {
    name: 'audit-immutable',
    evaluate: (_identity, action, resource) => {
      if (resource === 'audit-session' && ['write', 'delete'].includes(action)) {
        return {
          decision: 'DENY',
          reason: 'Audit sessions are immutable',
          auditLog: true,
        };
      }
      return null;
    },
  },

  // Rule 6: Permission-based access (default)
  {
    name: 'permission-check',
    evaluate: (identity, action, resource) => {
      const permissionMap = ACTION_PERMISSION_MAP[resource];
      if (!permissionMap) {
        return {
          decision: 'DENY',
          reason: `Unknown resource: ${resource}`,
          auditLog: true,
        };
      }

      const requiredPermission = permissionMap[action];
      if (requiredPermission === null) {
        return {
          decision: 'DENY',
          reason: `Action '${action}' not allowed on resource '${resource}'`,
          auditLog: true,
        };
      }

      if (hasPermission(identity.role, requiredPermission)) {
        return { decision: 'ALLOW', reason: `Has permission: ${requiredPermission}` };
      }

      return {
        decision: 'DENY',
        reason: `Missing permission: ${requiredPermission}`,
        auditLog: true,
      };
    },
  },
];

// ============= Main Policy Function =============

/**
 * The core policy decision function.
 * 
 * @param identity - The authenticated user's identity
 * @param action - The action being attempted
 * @param resource - The resource being accessed
 * @param context - Additional context for the decision
 * @returns PolicyResult with ALLOW or DENY decision
 */
export function can(
  identity: Identity | null,
  action: Action,
  resource: Resource,
  context: PolicyContext = { timestamp: Date.now() }
): PolicyResult {
  // Unauthenticated requests are always denied
  if (!identity) {
    return {
      decision: 'DENY',
      reason: 'Authentication required',
      auditLog: true,
    };
  }

  // Run through policy rules in order
  for (const rule of policyRules) {
    const result = rule.evaluate(identity, action, resource, context);
    if (result !== null) {
      return result;
    }
  }

  // Default deny if no rule matched
  return {
    decision: 'DENY',
    reason: 'No policy rule matched',
    auditLog: true,
  };
}

/**
 * Batch check multiple permissions
 */
export function canAll(
  identity: Identity | null,
  checks: Array<{ action: Action; resource: Resource; context?: PolicyContext }>
): boolean {
  return checks.every(check => 
    can(identity, check.action, check.resource, check.context).decision === 'ALLOW'
  );
}

/**
 * Check if any permission is granted
 */
export function canAny(
  identity: Identity | null,
  checks: Array<{ action: Action; resource: Resource; context?: PolicyContext }>
): boolean {
  return checks.some(check => 
    can(identity, check.action, check.resource, check.context).decision === 'ALLOW'
  );
}
