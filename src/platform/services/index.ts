/**
 * Platform Services Index
 * 
 * All services must register with the router on initialization.
 */

export * from './telemetry';

// Import and register all services
import { registerTelemetryService } from './telemetry';

/**
 * Initialize all platform services
 * Call this once at application startup
 */
export function initializeServices(): void {
  registerTelemetryService();
  
  // Future services:
  // registerAuditService();
  // registerChallengeService();
  // registerSOCService();
}
