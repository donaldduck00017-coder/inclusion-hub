/**
 * Auth Module - Public Interface
 * 
 * This is the sole entry point for authentication concerns.
 * All auth operations must go through these exports.
 * 
 * TRUST BOUNDARY:
 * - Only this module handles credentials and tokens
 * - Other modules receive Identity objects, never raw credentials
 * - Session management is encapsulated here
 */

// Identity management
export {
  createSession,
  validateToken,
  getIdentity,
  getSession,
  destroySession,
  refreshToken,
  isAtLeastRole,
  hashForPrivacy,
  clearAllSessions,
} from './identity';

// Credential validation (internal use only - policy should gate access)
export {
  validateCredentials,
  getUserById,
  getUserByEmail,
  emailExists,
  type UserCredentials,
  type UserRecord,
} from './credentials';

// Re-export identity types
export type { Identity, Session, UserRole } from '../types';
