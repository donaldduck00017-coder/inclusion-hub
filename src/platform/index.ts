/**
 * Platform Module - Main Entry Point
 * 
 * This is the control plane for the Inclusion Cyber Platform.
 * 
 * ARCHITECTURE:
 * All requests flow through the lifecycle:
 *   Request → Auth → Policy → Router → Service → Observe → Response
 * 
 * TRUST BOUNDARIES:
 * - Auth: Owns identity, sessions, credentials
 * - Policy: Makes all access control decisions
 * - Router: Enforces the request lifecycle
 * - Services: Perform work (no auth/policy decisions)
 * - Observe: Records all significant events
 */

// Core modules
export * from './core';

// Observation
export * from './observe';

// Services
export * from './services';
