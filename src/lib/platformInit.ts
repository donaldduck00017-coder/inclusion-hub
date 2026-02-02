/**
 * Platform Initialization
 * 
 * This file initializes the platform control plane.
 * Call this once at application startup.
 */

import { initializeServices } from '@/platform/services';

let initialized = false;

/**
 * Initialize the platform
 * Safe to call multiple times - will only run once
 */
export function initializePlatform(): void {
  if (initialized) {
    return;
  }
  
  // Register all service handlers
  initializeServices();
  
  initialized = true;
  
  if (import.meta.env.DEV) {
    console.log('🚀 Platform initialized');
  }
}

/**
 * Reset platform state (for testing)
 */
export function resetPlatform(): void {
  initialized = false;
}
