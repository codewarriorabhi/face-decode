
-- Restrict SECURITY DEFINER helpers to internal use only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_sessions() FROM PUBLIC, anon, authenticated;

-- Tighten the overly-permissive INSERT policy on sessions
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.sessions;

CREATE POLICY "Anon and authenticated can create sessions"
ON public.sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'active'
  AND expires_at > now()
  AND expires_at <= now() + interval '24 hours'
);
