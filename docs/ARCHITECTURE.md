# Platform Architecture

## Overview

Inclusion-Cyber-Platform uses a **control-plane-driven architecture** with explicit trust boundaries, a dedicated policy layer, and an enforced request lifecycle.

## Core Principle

> **Every request must prove its identity and right to act before any work is done.**

## Folder Structure

```
/src
├── /platform              # Control plane
│   ├── /core              # Core infrastructure
│   │   ├── /auth          # Identity & session management
│   │   ├── /policy        # Access control decisions
│   │   └── /router        # Request lifecycle enforcement
│   ├── /services          # Business logic (work happens here)
│   │   ├── /telemetry     # Event tracking & sessions
│   │   ├── /audit         # Session replay & forensics
│   │   ├── /soc           # Security operations center
│   │   └── /challenges    # Challenge management
│   └── /observe           # Logging & metrics
│       ├── logger.ts      # Structured logging
│       └── metrics.ts     # Metrics collection
├── /apps                  # UI applications (future)
└── /docs                  # Documentation
```

## Request Lifecycle

Every backend request MUST follow this flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐    ┌──────┐    ┌────────┐    ┌─────────┐         │
│   │ Request │───▶│ Auth │───▶│ Policy │───▶│ Router  │         │
│   │ (UI/API)│    │(who) │    │(allowed│    │(route)  │         │
│   └─────────┘    └──────┘    │ or not)│    └────┬────┘         │
│                              └────────┘         │               │
│                                                 ▼               │
│   ┌──────────┐    ┌─────────┐    ┌─────────────────┐           │
│   │ Response │◀───│ Observe │◀───│    Service      │           │
│   │          │    │ (log)   │    │   (do work)     │           │
│   └──────────┘    └─────────┘    └─────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phases

1. **Received**: Request arrives from UI or API
2. **Authenticated**: Identity verified via token
3. **Authorized**: Policy engine grants or denies access
4. **Routed**: Request dispatched to appropriate service
5. **Executed**: Service performs the work
6. **Observed**: Event logged for audit trail
7. **Responded**: Result returned to caller

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNTRUSTED                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    UI / Browser                          │   │
│  │  • User input                                            │   │
│  │  • LocalStorage                                          │   │
│  │  • Client-side state                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Token Required
┌─────────────────────────────────────────────────────────────────┐
│                      TRUST BOUNDARY 1: Auth                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  /platform/core/auth                     │   │
│  │  • Token validation                                      │   │
│  │  • Session management                                    │   │
│  │  • Credential handling (ONLY here)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Identity Established
┌─────────────────────────────────────────────────────────────────┐
│                     TRUST BOUNDARY 2: Policy                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 /platform/core/policy                    │   │
│  │  • can(identity, action, resource, context) → ALLOW|DENY│   │
│  │  • Kill switches                                         │   │
│  │  • Permission checks                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Authorization Granted
┌─────────────────────────────────────────────────────────────────┐
│                          TRUSTED ZONE                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    /platform/services                    │   │
│  │  • Business logic                                        │   │
│  │  • Data operations                                       │   │
│  │  • NO auth/policy decisions                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   /platform/observe                      │   │
│  │  • Audit logging                                         │   │
│  │  • Metrics                                               │   │
│  │  • Security events                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Auth (`/platform/core/auth`)

**Owns:**
- User model and identity
- Session creation and validation
- Token generation and refresh
- Credential validation

**Does NOT do:**
- Make access control decisions (that's Policy)
- Execute business logic (that's Services)

### Policy (`/platform/core/policy`)

**Owns:**
- `can(identity, action, resource, context)` function
- Permission definitions per role
- Kill switch enforcement
- Owner-based access rules

**Does NOT do:**
- Authenticate users (that's Auth)
- Execute business logic (that's Services)

### Router (`/platform/core/router`)

**Owns:**
- Request lifecycle enforcement
- Service registry
- Error handling
- Response formatting

**Does NOT do:**
- Make policy decisions (delegates to Policy)
- Handle credentials (delegates to Auth)

### Services (`/platform/services/*`)

**Owns:**
- Business logic
- Data operations
- Domain-specific rules

**Does NOT do:**
- Authenticate requests (Router does that)
- Make policy decisions (Router does that)
- Talk to other services directly (must go through Router)

### Observe (`/platform/observe`)

**Owns:**
- Structured logging
- Metrics collection
- Security event tracking
- Audit trail

## Key Invariants

1. **No Direct Service Access**: UI never calls services directly. All requests go through `execute()`.

2. **Policy Before Work**: No service handler runs until policy returns `ALLOW`.

3. **Auth is Isolated**: Only `/platform/core/auth` touches credentials or tokens.

4. **Everything is Observed**: All significant events are logged with structured data.

5. **Kill Switches Work**: Emergency shutdown, read-only mode, and feature toggles are enforced at the policy layer.

## Usage Example

```typescript
import { execute, createSession, validateCredentials } from '@/platform';

// 1. Login: Validate credentials (Auth layer)
const user = await validateCredentials({ email, password });
if (!user) throw new Error('Invalid credentials');

// 2. Create session (Auth layer)
const { token, identity } = createSession(user.id, user.role);

// 3. Make requests (Router → Policy → Service → Observe)
const response = await execute({
  token,
  action: 'read',
  resource: 'challenge',
  resourceId: 'challenge-1',
  payload: {},
});

if (!response.success) {
  console.error(response.error);
} else {
  console.log(response.data);
}
```

## Future Considerations

- Move to true microservices with inter-service auth
- Add rate limiting at the router level
- Implement distributed tracing with correlation IDs
- Add circuit breakers for external service calls
