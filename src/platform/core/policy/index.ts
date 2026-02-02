/**
 * Policy Module - Public Interface
 * 
 * This is the sole entry point for policy decisions.
 * All authorization must go through these exports.
 * 
 * TRUST BOUNDARY:
 * - Policy decisions are final and logged
 * - Services must not bypass the policy layer
 * - All access control logic lives here
 */

// Core policy engine
export {
  can,
  canAll,
  canAny,
  updateKillSwitches,
  getKillSwitches,
} from './engine';

// Permission utilities
export {
  hasPermission,
  getPermissions,
  isRoleAtLeast,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
} from './permissions';

// Re-export policy types
export type {
  Permission,
  Action,
  Resource,
  PolicyContext,
  PolicyResult,
  PolicyDecision,
  KillSwitchState,
} from '../types';
