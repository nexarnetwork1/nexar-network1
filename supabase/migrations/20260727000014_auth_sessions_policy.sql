-- Allow users to insert their own session records and revoke other sessions

CREATE POLICY "Users insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.revoke_user_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW()
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_session(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_other_user_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW()
  WHERE user_id = auth.uid()
    AND revoked_at IS NULL
    AND created_at < (
      SELECT MAX(created_at)
      FROM public.user_sessions
      WHERE user_id = auth.uid() AND revoked_at IS NULL
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_other_user_sessions() TO authenticated;
