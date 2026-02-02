/**
 * Identity System
 * 
 * This module owns all identity-related concerns:
 * - User model
 * - Session management
 * - Token validation
 * - Credential handling
 * 
 * TRUST BOUNDARY: Only this module may access credentials or tokens directly.
 * All other modules must go through the public interface.
 */

import type { Identity, Session, UserRole, Permission } from '../types';
import { ROLE_PERMISSIONS } from '../policy/permissions';

// ============= Session Storage =============

const sessions = new Map<string, Session>();
const identities = new Map<string, Identity>();

// ============= Token Management =============

const TOKEN_EXPIRY_MS = 3600 * 1000; // 1 hour
const SESSION_EXPIRY_MS = 24 * 3600 * 1000; // 24 hours

/**
 * Generate a secure session ID
 * In production, use crypto.randomUUID() or similar
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a secure token
 * In production, use JWT with proper signing
 */
function generateToken(userId: string, sessionId: string): string {
  const payload = {
    sub: userId,
    sid: sessionId,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  // In production: sign with private key
  return `tok_${btoa(JSON.stringify(payload))}`;
}

/**
 * Parse and validate a token
 * Returns null if invalid or expired
 */
function parseToken(token: string): { userId: string; sessionId: string; exp: number } | null {
  if (!token.startsWith('tok_')) {
    // Also accept legacy mock tokens for backward compatibility
    if (token.startsWith('mock-token-')) {
      const parts = token.split('-');
      return {
        userId: parts[2] || 'unknown',
        sessionId: `legacy_${parts[2]}`,
        exp: Date.now() + TOKEN_EXPIRY_MS,
      };
    }
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.slice(4)));
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return {
      userId: payload.sub,
      sessionId: payload.sid,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Hash sensitive data (user IDs, IPs) for privacy
 */
export function hashForPrivacy(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `anon_${Math.abs(hash).toString(16)}`;
}

// ============= Public Interface =============

/**
 * Create a new session for a user
 * Called after successful credential validation
 */
export function createSession(userId: string, role: UserRole, metadata?: {
  ipHash?: string;
  userAgent?: string;
}): { session: Session; token: string; identity: Identity } {
  const sessionId = generateSessionId();
  const now = Date.now();
  
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_MS,
    lastActivityAt: now,
    ipHash: metadata?.ipHash,
    userAgent: metadata?.userAgent,
  };
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  const identity: Identity = {
    userId,
    role,
    sessionId,
    tokenExpiry: now + TOKEN_EXPIRY_MS,
    permissions,
  };
  
  const token = generateToken(userId, sessionId);
  
  // Store session and identity
  sessions.set(sessionId, session);
  identities.set(sessionId, identity);
  
  return { session, token, identity };
}

/**
 * Validate a token and return the associated identity
 * Returns null if token is invalid or session expired
 */
export function validateToken(token: string): Identity | null {
  const parsed = parseToken(token);
  if (!parsed) {
    return null;
  }
  
  const identity = identities.get(parsed.sessionId);
  if (!identity) {
    return null;
  }
  
  // Update session activity
  const session = sessions.get(parsed.sessionId);
  if (session) {
    if (session.expiresAt < Date.now()) {
      // Session expired
      destroySession(parsed.sessionId);
      return null;
    }
    session.lastActivityAt = Date.now();
  }
  
  return identity;
}

/**
 * Get the current identity for a session
 */
export function getIdentity(sessionId: string): Identity | null {
  return identities.get(sessionId) || null;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) || null;
}

/**
 * Destroy a session (logout)
 */
export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
  identities.delete(sessionId);
}

/**
 * Refresh a token
 * Returns a new token with extended expiry
 */
export function refreshToken(currentToken: string): { token: string; expiresIn: number } | null {
  const parsed = parseToken(currentToken);
  if (!parsed) {
    return null;
  }
  
  const identity = identities.get(parsed.sessionId);
  if (!identity) {
    return null;
  }
  
  const newToken = generateToken(identity.userId, parsed.sessionId);
  identity.tokenExpiry = Date.now() + TOKEN_EXPIRY_MS;
  
  return {
    token: newToken,
    expiresIn: TOKEN_EXPIRY_MS / 1000,
  };
}

/**
 * Check if a role has at least the privileges of another role
 */
export function isAtLeastRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['student', 'instructor', 'admin'];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}

/**
 * Clear all sessions (for testing/emergency)
 */
export function clearAllSessions(): void {
  sessions.clear();
  identities.clear();
}
