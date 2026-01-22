/**
 * Input Sanitization Utilities
 * 
 * Security-first approach: treat all external data as untrusted.
 * These utilities sanitize data before rendering to prevent XSS.
 */

/**
 * Escape HTML entities to prevent XSS
 * Use this for any user-generated or external content
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize an object's string values recursively
 * Used for snapshot inputState and other untrusted payloads
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = escapeHtml(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' 
          ? escapeHtml(item) 
          : item !== null && typeof item === 'object'
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Validate and sanitize a URL
 * Only allows http/https protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a session ID for display (shortened hash)
 */
export function formatSessionId(sessionId: string): string {
  if (sessionId.length <= 12) return sessionId;
  return `${sessionId.slice(0, 6)}...${sessionId.slice(-4)}`;
}

/**
 * Validate that a value is a valid severity level
 */
export function isValidSeverity(value: unknown): value is 'low' | 'medium' | 'high' | 'critical' {
  return typeof value === 'string' && 
    ['low', 'medium', 'high', 'critical'].includes(value);
}
