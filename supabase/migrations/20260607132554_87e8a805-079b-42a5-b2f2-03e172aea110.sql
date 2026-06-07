ALTER TABLE public.emotion_history
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_estimate integer;