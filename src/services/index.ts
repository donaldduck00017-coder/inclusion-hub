import { mockAuthService } from './mockAuthService';
import { mockChallengeService } from './mockChallengeService';
import { mockProgressService } from './mockProgressService';
import { mockTelemetryService } from './mockTelemetryService';
import { mockHealthService } from './mockHealthService';
import { mockAdminService } from './mockAdminService';
import { mockRoleService } from './mockRoleService';
import { config } from '@/lib/config';
import { ApiVersion, API_VERSIONS, getDeprecationNotice } from './api-contract';

// Re-export API contract utilities
export { ApiVersion, API_VERSIONS, getApiConfig, isVersionDeprecated, getDeprecationNotice } from './api-contract';

/**
 * Service Factory Pattern
 * 
 * Provides a centralized way to access all services with:
 * - Mock/real API switching based on config
 * - API version management with deprecation warnings
 * - Type-safe service access
 */
class ServiceFactory {
  private currentVersion: ApiVersion;
  private deprecationWarningShown = false;

  constructor() {
    this.currentVersion = this.parseVersion(config.apiVersion);
    this.checkDeprecation();
  }

  private parseVersion(version: string): ApiVersion {
    return version === 'v1' ? ApiVersion.V1 : ApiVersion.V2;
  }

  private checkDeprecation(): void {
    const versionConfig = API_VERSIONS[this.currentVersion];
    
    if (versionConfig.deprecated && !this.deprecationWarningShown) {
      const notice = getDeprecationNotice(this.currentVersion);
      if (notice) {
        console.warn(
          `[API] Version ${this.currentVersion} is deprecated.\n` +
          `  Sunset date: ${notice.sunsetDate}\n` +
          `  Migration guide: ${notice.migrationGuide}\n` +
          `  Please migrate to ${notice.replacedBy}.`
        );
      }
      this.deprecationWarningShown = true;
    }
  }

  /**
   * Get the current API version
   */
  getVersion(): ApiVersion {
    return this.currentVersion;
  }

  /**
   * Check if using mock mode
   */
  isMockMode(): boolean {
    return config.apiBaseUrl === 'mock';
  }

  /**
   * Authentication Service
   * Handles: login, logout, token refresh, user validation
   */
  getAuthService() {
    if (this.isMockMode()) {
      return mockAuthService;
    }
    // Return version-specific real service when available
    // For now, fall back to mock
    return mockAuthService;
  }

  /**
   * Challenge Service
   * Handles: challenge listing, filtering, submissions, hints
   */
  getChallengeService() {
    if (this.isMockMode()) {
      return mockChallengeService;
    }
    return mockChallengeService;
  }

  /**
   * Progress Service
   * Handles: user progress, skills, challenge history
   */
  getProgressService() {
    if (this.isMockMode()) {
      return mockProgressService;
    }
    return mockProgressService;
  }

  /**
   * Telemetry Service
   * Handles: event tracking, sessions, analytics
   */
  getTelemetryService() {
    if (this.isMockMode()) {
      return mockTelemetryService;
    }
    return mockTelemetryService;
  }

  /**
   * Health Service
   * Handles: system health, service status, metrics
   */
  getHealthService() {
    if (this.isMockMode()) {
      return mockHealthService;
    }
    return mockHealthService;
  }

  /**
   * Admin Service
   * Handles: kill switches, system controls
   */
  getAdminService() {
    if (this.isMockMode()) {
      return mockAdminService;
    }
    return mockAdminService;
  }

  /**
   * Role Service
   * Handles: permissions, feature flags, role checks
   */
  getRoleService() {
    if (this.isMockMode()) {
      return mockRoleService;
    }
    return mockRoleService;
  }

  /**
   * Get all services as an object
   */
  getAllServices() {
    return {
      auth: this.getAuthService(),
      challenge: this.getChallengeService(),
      progress: this.getProgressService(),
      telemetry: this.getTelemetryService(),
      health: this.getHealthService(),
      admin: this.getAdminService(),
      role: this.getRoleService(),
    };
  }
}

// Singleton instance
export const serviceFactory = new ServiceFactory();

// Export individual services for convenience
export const authService = serviceFactory.getAuthService();
export const challengeService = serviceFactory.getChallengeService();
export const progressService = serviceFactory.getProgressService();
export const telemetryService = serviceFactory.getTelemetryService();
export const healthService = serviceFactory.getHealthService();
export const adminService = serviceFactory.getAdminService();
export const roleService = serviceFactory.getRoleService();

// Export service types for consumers
export type { MockAuthService } from './mockAuthService';
export type { MockChallengeService } from './mockChallengeService';
export type { MockProgressService } from './mockProgressService';
export type { MockTelemetryService } from './mockTelemetryService';
export type { MockHealthService } from './mockHealthService';
export type { MockAdminService } from './mockAdminService';
export type { MockRoleService } from './mockRoleService';
