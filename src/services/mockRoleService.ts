import { config } from '@/lib/config';
import type { User, UserRole, FeatureFlags } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Role hierarchy (higher index = more privileges)
const ROLE_HIERARCHY: UserRole[] = ['student', 'instructor', 'admin'];

// Permission definitions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  student: [
    'challenges:view',
    'challenges:submit',
    'progress:view',
    'hints:use',
  ],
  instructor: [
    'challenges:view',
    'challenges:submit',
    'challenges:create',
    'progress:view',
    'progress:view-class',
    'hints:use',
    'soc:view',
    'telemetry:export',
  ],
  admin: [
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
    'telemetry:export',
  ],
};

export const mockRoleService = {
  // Get all roles for a user (could be multiple in future)
  async getUserRoles(userId: string): Promise<UserRole[]> {
    await delay(config.mockDelay / 2);
    // For now, users have a single role
    // This could be extended to support multiple roles
    return []; // Role comes from user object
  },

  // Check if user has a specific permission
  async checkPermission(user: User, permission: string): Promise<boolean> {
    await delay(config.mockDelay / 4);
    
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Check exact match
    if (permissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions (e.g., 'admin:*')
    const [category] = permission.split(':');
    if (permissions.includes(`${category}:*`)) {
      return true;
    }

    return false;
  },

  // Check if user has any of the specified permissions
  async checkAnyPermission(user: User, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.checkPermission(user, permission)) {
        return true;
      }
    }
    return false;
  },

  // Check if user has all of the specified permissions
  async checkAllPermissions(user: User, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.checkPermission(user, permission))) {
        return false;
      }
    }
    return true;
  },

  // Get all permissions for a user
  async getPermissions(user: User): Promise<string[]> {
    await delay(config.mockDelay / 2);
    return ROLE_PERMISSIONS[user.role] || [];
  },

  // Check if role A is higher than role B
  isHigherRole(roleA: UserRole, roleB: UserRole): boolean {
    return ROLE_HIERARCHY.indexOf(roleA) > ROLE_HIERARCHY.indexOf(roleB);
  },

  // Check if role A is at least as high as role B
  isAtLeastRole(roleA: UserRole, roleB: UserRole): boolean {
    return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(roleB);
  },

  // Get feature flags for a user based on their role
  async getFeatureFlags(user: User): Promise<FeatureFlags> {
    await delay(config.mockDelay / 2);

    // Check kill switches first
    if (config.killSwitches.emergencyShutdown) {
      return {
        aiTutor: false,
        advancedChallenges: false,
        socDashboard: false,
        auditMode: false,
        telemetryExport: false,
        customChallenges: false,
        healthPanel: true, // Always allow health panel for admins
      };
    }

    if (config.killSwitches.readOnlyMode) {
      return {
        aiTutor: false,
        advancedChallenges: false,
        socDashboard: user.role !== 'student',
        auditMode: user.role === 'admin',
        telemetryExport: false,
        customChallenges: false,
        healthPanel: user.role === 'admin',
      };
    }

    // Normal feature computation
    return {
      aiTutor: config.features.aiTutor && !config.killSwitches.disableAiTutor,
      advancedChallenges: user.skillLevel >= 3,
      socDashboard: ['admin', 'instructor'].includes(user.role),
      auditMode: user.role === 'admin' && config.features.auditMode,
      telemetryExport: user.role === 'instructor' || user.role === 'admin',
      customChallenges: user.role === 'instructor' || user.role === 'admin',
      healthPanel: user.role === 'admin',
    };
  },

  // Get role hierarchy (for UI display)
  getRoleHierarchy(): UserRole[] {
    return [...ROLE_HIERARCHY];
  },

  // Get permissions for a role (without requiring a user)
  getRolePermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  },
};

export type MockRoleService = typeof mockRoleService;
