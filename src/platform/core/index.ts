/**
 * Platform Core - Public Interface
 * 
 * This module exports the core control plane functionality:
 * - Auth: Identity and session management
 * - Policy: Access control decisions
 * - Router: Request lifecycle enforcement
 * 
 * ARCHITECTURE:
 * All requests flow through: Auth → Policy → Router → Service → Observe
 */

// Auth module
export * from './auth';

// Policy module
export * from './policy';

// Router module
export * from './router';

// Core types
export * from './types';
