
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to mark expired sessions
CREATE OR REPLACE FUNCTION public.expire_old_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.sessions
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
$$;

-- Schedule the job every minute
SELECT cron.schedule(
  'expire-old-sessions',
  '* * * * *',
  $$ SELECT public.expire_old_sessions(); $$
);

-- Replace the public emotion_history SELECT policy so only active session data is visible
DROP POLICY IF EXISTS "Session emotion history is publicly viewable" ON public.emotion_history;

CREATE POLICY "Active session emotion history is publicly viewable"
ON public.emotion_history
FOR SELECT
TO public
USING (
  session_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.session_id = emotion_history.session_id
      AND s.status = 'active'
      AND s.expires_at > now()
  )
);
