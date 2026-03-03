-- Housekeeping function to avoid unbounded growth in edge_rate_limits

CREATE OR REPLACE FUNCTION public.cleanup_edge_rate_limits(
  p_older_than_seconds INTEGER DEFAULT 86400
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_threshold TIMESTAMPTZ := NOW() - make_interval(secs => GREATEST(60, COALESCE(p_older_than_seconds, 86400)));
BEGIN
  DELETE FROM public.edge_rate_limits
  WHERE updated_at < v_threshold;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.cleanup_edge_rate_limits(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_edge_rate_limits(INTEGER) TO service_role;

