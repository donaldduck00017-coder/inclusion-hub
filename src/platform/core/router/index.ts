/**
 * Router Module - Public Interface
 * 
 * This is the entry point for executing requests.
 * All UI and API calls must go through the execute function.
 * 
 * TRUST BOUNDARY:
 * - The router enforces the request lifecycle
 * - No direct service access is allowed
 * - All requests are authenticated, authorized, and observed
 */

export {
  execute,
  registerService,
  clearServices,
} from './lifecycle';

// Re-export request/response types
export type {
  Request,
  Response,
  RequestContext,
  ServiceRequest,
  ServiceResult,
  ResponseError,
  ResponseMeta,
} from '../types';
