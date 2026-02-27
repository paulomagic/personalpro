-- Harden invitation lookup: remove broad SELECT policy and expose token lookup via SECURITY DEFINER RPC

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token VARCHAR)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  client_id UUID,
  status VARCHAR,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.client_id, i.status, i.expires_at
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(VARCHAR) TO anon, authenticated;
