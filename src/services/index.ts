import { mockAuthService } from './mockAuthService';
import { mockChallengeService } from './mockChallengeService';
import { mockProgressService } from './mockProgressService';
import { config } from '@/lib/config';

// Service factory for dependency injection
// Allows switching between mock and real implementations

class ServiceFactory {
  private currentVersion: string;

  constructor() {
    this.currentVersion = config.apiVersion;
    this.checkDeprecation();
  }

  private checkDeprecation() {
    if (this.currentVersion === 'v1') {
      console.warn(
        '[API] Version v1 is deprecated. Sunset date: 2026-06-01. ' +
        'Please migrate to v2.'
      );
    }
  }

  getAuthService() {
    if (config.apiBaseUrl === 'mock') {
      return mockAuthService;
    }
    // Return real auth service when available
    return mockAuthService;
  }

  getChallengeService() {
    if (config.apiBaseUrl === 'mock') {
      return mockChallengeService;
    }
    // Return real challenge service when available
    return mockChallengeService;
  }

  getProgressService() {
    if (config.apiBaseUrl === 'mock') {
      return mockProgressService;
    }
    // Return real progress service when available
    return mockProgressService;
  }
}

export const serviceFactory = new ServiceFactory();

// Export individual services for convenience
export const authService = serviceFactory.getAuthService();
export const challengeService = serviceFactory.getChallengeService();
export const progressService = serviceFactory.getProgressService();
