/**
 * Permission Definitions
 * 
 * Static permission mappings for each role.
 * This is the source of truth for what each role can do.
 */

import type { Permission, UserRole } from '../types';

/**
 * Role-to-permission mapping
 * Higher roles inherit all permissions from lower roles
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'challenges:view',
    'challenges:submit',
    'progress:view',
    'hints:use',
    'telemetry:view',
  ],
  
  instructor: [
    // Inherits student permissions
    'challenges:view',
    'challenges:submit',
    'challenges:create',
    'progress:view',
    'progress:view-class',
    'hints:use',
    // Instructor-specific
    'soc:view',
    'audit:view',
    'telemetry:view',
    'telemetry:export',
  ],
  
  admin: [
    // All permissions
    'challenges:view',
    'challenges:submit',
    'challenges:create',
    'challenges:delete',
    'progress:view',
    'progress:view-class',
    'progress:view-all',
    'hints:use',
    'soc:view',
    'soc:manage',
    'audit:view',
    'audit:replay',
    'health:view',
    'health:manage',
    'admin:kill-switches',
    'admin:users',
    'telemetry:view',
    'telemetry:export',
  ],
};

/**
 * Role hierarchy (ascending privilege order)
 */
export const ROLE_HIERARCHY: UserRole[] = ['student', 'instructor', 'admin'];

/**
 * Check if a permission is granted to a role
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Check if roleA >= roleB in the hierarchy
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(roleB);
}
