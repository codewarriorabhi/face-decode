-- Fix security warnings: Remove overly permissive UPDATE policy on sessions
-- Sessions will be determined as active/expired based on expires_at timestamp alone
-- No status field mutation needed from the client side

DROP POLICY IF EXISTS "Anyone can update session status" ON public.sessions;