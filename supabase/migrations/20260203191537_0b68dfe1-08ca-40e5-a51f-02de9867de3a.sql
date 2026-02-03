-- =====================================================
-- CONTROL PLANE AUTH BACKEND - DATABASE SCHEMA
-- =====================================================

-- Create role enum for users
CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'soc', 'admin');

-- Create subject type enum for sessions
CREATE TYPE public.subject_type AS ENUM ('user', 'service');

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  skill_level INTEGER NOT NULL DEFAULT 1,
  avatar TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER ROLES TABLE (Separate from users for security)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SERVICES TABLE (For service-to-service auth)
-- =====================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  trust_level INTEGER NOT NULL DEFAULT 1,
  secret_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SESSIONS TABLE (Kill switch for revocation)
-- =====================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL,
  subject_type public.subject_type NOT NULL,
  token_hash TEXT,
  ip_address INET,
  user_agent TEXT,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Index for fast session lookups
CREATE INDEX idx_sessions_subject ON public.sessions(subject_id, subject_type);
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at) WHERE NOT revoked;

-- =====================================================
-- AUTH EVENTS TABLE (Observe layer)
-- =====================================================
CREATE TABLE public.auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  subject_id UUID,
  subject_type public.subject_type,
  session_id UUID REFERENCES public.sessions(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Index for audit queries
CREATE INDEX idx_auth_events_subject ON public.auth_events(subject_id, created_at DESC);
CREATE INDEX idx_auth_events_type ON public.auth_events(event_type, created_at DESC);

-- =====================================================
-- REFRESH TOKENS TABLE
-- =====================================================
CREATE TABLE public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Index for token lookups
CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens(token_hash) WHERE NOT used;

-- =====================================================
-- SECURITY DEFINER FUNCTIONS (Created after tables exist)
-- =====================================================

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =====================================================
-- RLS POLICIES (Created after functions exist)
-- =====================================================

-- Users can read their own record
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (subject_id = auth.uid() AND subject_type = 'user');

-- Users can view their own auth events
CREATE POLICY "Users can view own auth events" ON public.auth_events
  FOR SELECT USING (subject_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < now() - INTERVAL '7 days'
  RETURNING 1 INTO deleted_count;
  
  RETURN COALESCE(deleted_count, 0);
END;
$$;

-- Function to revoke all sessions for a user
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(_user_id UUID, _reason TEXT DEFAULT 'manual_revocation')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.sessions
  SET revoked = true, revoked_at = now(), revoked_reason = _reason
  WHERE subject_id = _user_id
    AND subject_type = 'user'
    AND NOT revoked;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- =====================================================
-- PUBLIC VIEW FOR USERS (Hides password_hash)
-- =====================================================
CREATE VIEW public.users_public
WITH (security_invoker=on) AS
  SELECT id, email, name, skill_level, avatar, email_verified, created_at, updated_at
  FROM public.users;