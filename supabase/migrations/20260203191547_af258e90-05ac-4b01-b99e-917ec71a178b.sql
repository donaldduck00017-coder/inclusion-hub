-- Add restrictive policies for tables that should have no direct access
-- (These are managed only via edge functions with service role)

-- Services table - no direct access (admin via edge functions only)
CREATE POLICY "No direct access to services" ON public.services
  FOR ALL USING (false);

-- Refresh tokens - no direct access (managed via edge functions only)
CREATE POLICY "No direct access to refresh tokens" ON public.refresh_tokens
  FOR ALL USING (false);