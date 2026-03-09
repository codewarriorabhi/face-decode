-- Create emotion_history table
CREATE TABLE public.emotion_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emotion_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view their own emotion history"
  ON public.emotion_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own emotion history"
  ON public.emotion_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own emotion history"
  ON public.emotion_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast queries by user and date
CREATE INDEX idx_emotion_history_user_date ON public.emotion_history (user_id, date_time DESC);