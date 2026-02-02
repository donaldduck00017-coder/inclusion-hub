/**
 * Credential Validation
 * 
 * TRUST BOUNDARY: This is the ONLY module that handles raw credentials.
 * - Password validation
 * - Credential storage interface
 * - Hashing (in production)
 * 
 * NO other module should ever see raw passwords.
 */

import type { UserRole } from '../types';
import usersData from '@/data/users.json';

// ============= Types =============

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  skillLevel: number;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface StoredUser extends UserRecord {
  password: string; // Only exists in credential store
}

// ============= Credential Store =============

// In production: This would be a secure database query
// Passwords would be hashed with bcrypt/argon2
const credentialStore = usersData as StoredUser[];

/**
 * Validate credentials and return user record (without password)
 * Returns null if credentials are invalid
 */
export async function validateCredentials(credentials: UserCredentials): Promise<UserRecord | null> {
  // Simulate async credential check (e.g., database query)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const user = credentialStore.find(
    u => u.email === credentials.email && u.password === credentials.password
  );
  
  if (!user) {
    return null;
  }
  
  // CRITICAL: Never return password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get a user record by ID (without password)
 */
export async function getUserById(userId: string): Promise<UserRecord | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const user = credentialStore.find(u => u.id === userId);
  if (!user) {
    return null;
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get a user record by email (without password)
 */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const user = credentialStore.find(u => u.email === email);
  if (!user) {
    return null;
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Check if an email is already registered
 */
export async function emailExists(email: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return credentialStore.some(u => u.email === email);
}
