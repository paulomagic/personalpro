-- Persistent rate limiting for Edge Functions (AI proxies)

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_seconds INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_updated_at
  ON public.edge_rate_limits (updated_at);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  retry_after_seconds INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_seconds INTEGER := GREATEST(1, COALESCE(p_window_seconds, 60));
  v_max INTEGER := GREATEST(1, COALESCE(p_max, 20));
  v_row public.edge_rate_limits%ROWTYPE;
  v_reset_at TIMESTAMPTZ;
  v_retry_seconds INTEGER;
BEGIN
  SELECT *
  INTO v_row
  FROM public.edge_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.edge_rate_limits (key, count, window_start, window_seconds, updated_at)
    VALUES (p_key, 1, v_now, v_window_seconds, v_now);

    RETURN QUERY
    SELECT TRUE, v_max - 1, 0, v_now + make_interval(secs => v_window_seconds);
    RETURN;
  END IF;

  v_reset_at := v_row.window_start + make_interval(secs => v_row.window_seconds);

  IF v_now >= v_reset_at THEN
    UPDATE public.edge_rate_limits
    SET count = 1,
        window_start = v_now,
        window_seconds = v_window_seconds,
        updated_at = v_now
    WHERE key = p_key;

    RETURN QUERY
    SELECT TRUE, v_max - 1, 0, v_now + make_interval(secs => v_window_seconds);
    RETURN;
  END IF;

  IF v_row.count < v_max THEN
    UPDATE public.edge_rate_limits
    SET count = v_row.count + 1,
        updated_at = v_now
    WHERE key = p_key;

    RETURN QUERY
    SELECT TRUE, GREATEST(0, v_max - (v_row.count + 1)), 0, v_reset_at;
    RETURN;
  END IF;

  v_retry_seconds := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset_at - v_now)))::INTEGER);

  RETURN QUERY
  SELECT FALSE, 0, v_retry_seconds, v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON TABLE public.edge_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.edge_rate_limits TO service_role;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

