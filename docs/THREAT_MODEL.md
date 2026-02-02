# Threat Model

## Overview

This document describes the trust zones, abuse cases, and mitigations for the Inclusion Cyber Platform.

## Trust Zones

### Zone 1: Untrusted (Browser/Client)

**Location:** User's browser, localStorage, client-side code

**Threat Level:** 🔴 HIGH - Fully controlled by potential attacker

**Assumptions:**
- All client-side data can be manipulated
- localStorage is not secure storage
- Client-side validation is cosmetic only
- JavaScript can be inspected and modified

**What lives here:**
- React UI components
- Client-side state (Zustand stores)
- Cached data
- User input forms

### Zone 2: Semi-Trusted (Auth Boundary)

**Location:** `/platform/core/auth`

**Threat Level:** 🟡 MEDIUM - Attack surface for credential theft

**Assumptions:**
- Tokens may be stolen (XSS, network interception)
- Sessions may be hijacked
- Credential stuffing attacks are possible

**Defenses:**
- Token expiration (1 hour)
- Session expiration (24 hours)
- Credential validation isolated to single module
- No password storage in plaintext (production: bcrypt/argon2)

### Zone 3: Trusted (Policy + Services)

**Location:** `/platform/core/policy`, `/platform/services`

**Threat Level:** 🟢 LOW - Internal code, no direct user access

**Assumptions:**
- Code is reviewed and trusted
- Bugs may still exist (defense in depth)
- Logging captures all significant events

**Defenses:**
- Policy layer makes ALL access decisions
- Services cannot bypass policy
- All operations are logged

## Abuse Cases

### AC-1: Privilege Escalation via Role Manipulation

**Attack:** User modifies their role in localStorage/client state to gain admin access.

**Impact:** Full system access, data exfiltration, configuration changes.

**Status:** ✅ MITIGATED

**Mitigation:**
- Roles are NEVER read from client storage for authorization
- `can()` uses the Identity from server-validated token
- Policy checks happen server-side before any work

**Code Reference:**
```typescript
// Policy engine - src/platform/core/policy/engine.ts
export function can(identity: Identity | null, ...): PolicyResult {
  // identity comes from validated token, not client
  if (!identity) {
    return { decision: 'DENY', reason: 'Authentication required' };
  }
  // ...
}
```

### AC-2: Token Theft via XSS

**Attack:** Attacker injects JavaScript to steal auth token.

**Impact:** Session hijacking, unauthorized actions as victim.

**Status:** ⚠️ PARTIALLY MITIGATED

**Mitigation:**
- Tokens expire in 1 hour
- Content Security Policy headers (when deployed)
- React's built-in XSS protection

**Future Work:**
- HttpOnly cookies for token storage
- Token binding to IP/device fingerprint
- Automatic session invalidation on anomaly

### AC-3: Direct Service Access

**Attack:** Attacker calls service functions directly, bypassing auth/policy.

**Impact:** Unauthorized data access or modification.

**Status:** ✅ MITIGATED

**Mitigation:**
- Services are internal modules, not exposed to browser
- All requests must go through `execute()` which enforces lifecycle
- Service handlers receive pre-validated Identity objects

**Code Reference:**
```typescript
// Router - src/platform/core/router/lifecycle.ts
export async function execute<TReq, TRes>(options: ExecuteOptions<TReq>) {
  // 1. Auth check
  const identity = validateToken(options.token);
  if (!identity) return errorResponse('UNAUTHORIZED');
  
  // 2. Policy check
  const policyResult = can(identity, options.action, options.resource, ...);
  if (policyResult.decision === 'DENY') return errorResponse('FORBIDDEN');
  
  // 3. Only then: call service
  const result = await handler(serviceRequest);
}
```

### AC-4: Audit Log Tampering

**Attack:** Attacker attempts to modify or delete audit logs to cover tracks.

**Impact:** Loss of forensic evidence, undetected breaches.

**Status:** ✅ MITIGATED

**Mitigation:**
- Audit sessions are immutable (policy enforced)
- Write/delete operations on audit-session resource are blocked

**Code Reference:**
```typescript
// Policy rule - src/platform/core/policy/engine.ts
{
  name: 'audit-immutable',
  evaluate: (_identity, action, resource) => {
    if (resource === 'audit-session' && ['write', 'delete'].includes(action)) {
      return { decision: 'DENY', reason: 'Audit sessions are immutable' };
    }
    return null;
  },
}
```

### AC-5: Kill Switch Bypass

**Attack:** Attacker attempts to disable security controls (telemetry, AI tutor limits).

**Impact:** Reduced visibility, policy violations undetected.

**Status:** ✅ MITIGATED

**Mitigation:**
- Kill switch modification requires `admin:kill-switches` permission
- Changes are logged with security event classification
- Emergency shutdown cannot be bypassed by any role

### AC-6: Cross-User Data Access

**Attack:** User A tries to access User B's progress, submissions, or session data.

**Impact:** Privacy violation, data leakage.

**Status:** ✅ MITIGATED

**Mitigation:**
- Owner-based access rules in policy engine
- Progress data filtered by `resourceOwnerId`
- Instructors can only view class data (not all users)
- Admins have full access (appropriate for role)

**Code Reference:**
```typescript
// Policy rule - src/platform/core/policy/engine.ts
{
  name: 'progress-owner-access',
  evaluate: (identity, action, resource, context) => {
    if (resource === 'progress' && action === 'read') {
      if (context.resourceOwnerId === identity.userId) {
        return { decision: 'ALLOW', reason: 'Owner access' };
      }
      // ... instructor/admin checks
    }
    return null;
  },
}
```

### AC-7: Telemetry Exfiltration

**Attack:** Attacker captures telemetry data containing sensitive information.

**Impact:** User behavior profiling, privacy violation.

**Status:** ✅ MITIGATED

**Mitigation:**
- Privacy mode anonymizes user IDs (hash)
- Hint content stripped in minimization mode
- User input removed from metadata
- Data retention limits enforced

### AC-8: Emergency Shutdown Bypass

**Attack:** During incident, attacker tries to continue operations despite emergency shutdown.

**Impact:** Continued damage during active incident.

**Status:** ✅ MITIGATED

**Mitigation:**
- Emergency shutdown is checked FIRST in policy rules
- Only health-metrics resource accessible during shutdown
- No role can bypass (including admin)

## Security Events

The following events are logged with `security` level:

| Event | Trigger | Severity |
|-------|---------|----------|
| `auth_failed` | Invalid/expired token | High |
| `policy_denied` | Access denied by policy | Medium |
| `session_hijack_suspected` | Token used from new IP/device | High |
| `kill_switch_modified` | Kill switch state changed | High |
| `privilege_escalation_attempt` | Role change attempted | Critical |

## Recommendations

### Immediate (P0)

- [x] Policy engine with ALLOW/DENY
- [x] Auth isolated to single module
- [x] Request lifecycle enforced
- [x] Audit logs immutable

### Short-term (P1)

- [ ] HttpOnly cookies for tokens
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] Content Security Policy headers

### Medium-term (P2)

- [ ] Token binding to device fingerprint
- [ ] Anomaly detection for session hijacking
- [ ] Automated security scanning in CI
- [ ] Penetration testing

### Long-term (P3)

- [ ] Hardware security key support
- [ ] Zero-trust architecture for services
- [ ] Formal verification of policy rules
- [ ] Bug bounty program

## Security Contact

For security vulnerabilities, contact: security@inclusion-cyber.dev

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial threat model |
