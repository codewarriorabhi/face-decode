-- Create sessions table for emotion tracking links
CREATE TABLE public.sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  status text DEFAULT 'active' NOT NULL
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Public policies for sessions (anyone can create and view)
CREATE POLICY "Anyone can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view sessions"
  ON public.sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update session status"
  ON public.sessions FOR UPDATE
  USING (true);

-- Add session_id column to emotion_history
ALTER TABLE public.emotion_history 
  ADD COLUMN session_id text;

-- Make user_id nullable for session-based entries
ALTER TABLE public.emotion_history 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.emotion_history
  ADD CONSTRAINT emotion_history_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES public.sessions(session_id);

-- Ensure either user_id or session_id is set
ALTER TABLE public.emotion_history
  ADD CONSTRAINT emotion_history_user_or_session_required
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL);

-- Create index for session queries
CREATE INDEX idx_emotion_history_session_id ON public.emotion_history(session_id);

-- Drop existing INSERT policy and create new ones
DROP POLICY IF EXISTS "Users can insert their own emotion history" ON public.emotion_history;

-- Authenticated users can insert with their user_id
CREATE POLICY "Authenticated users insert their emotion history"
  ON public.emotion_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert session-based entries
CREATE POLICY "Anonymous can insert session emotion history"
  ON public.emotion_history FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Add SELECT policy for session-based data (for dashboard)
CREATE POLICY "Session emotion history is publicly viewable"
  ON public.emotion_history FOR SELECT
  USING (session_id IS NOT NULL);

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.emotion_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;