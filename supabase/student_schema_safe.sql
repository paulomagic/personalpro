-- ============================================
-- STUDENT MODE SCHEMA - PersonalPro (SAFE VERSION)
-- Remove policies antigas antes de criar novas
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============ REMOVER POLICIES ANTIGAS (Se existirem) ============

-- Remover policies de invitations
DROP POLICY IF EXISTS "Coaches can view their own invitations" ON invitations;
DROP POLICY IF EXISTS "Coaches can create invitations" ON invitations;
DROP POLICY IF EXISTS "Coaches can update their own invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Remover policies de user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Coaches can view their students profiles" ON user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;

-- ============ USER PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(20) NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach', 'student')),
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INVITATIONS TABLE ============
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_coach ON user_profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- ============ ROW LEVEL SECURITY (RLS) ============

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES FOR user_profiles ============

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent privilege/link tampering on self-updates
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND coach_id IS NOT DISTINCT FROM (SELECT coach_id FROM user_profiles WHERE id = auth.uid())
    AND client_id IS NOT DISTINCT FROM (SELECT client_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can view their students profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "System can insert profiles" ON user_profiles
  FOR INSERT
  WITH CHECK (
    -- Self-insert only; role/link assignment must happen server-side
    auth.uid() = id
    AND role = 'coach'
    AND coach_id IS NULL
    AND client_id IS NULL
  );

-- ============ POLICIES FOR invitations ============

CREATE POLICY "Coaches can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- ============ FUNCTIONS ============

-- Function to automatically create user_profile on signup (HARDENED)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    'coach',  -- FORCE coach role (ignore raw_user_meta_data)
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to run function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to accept invitation (TRANSACTIONAL)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token VARCHAR)
RETURNS JSON AS $$
DECLARE
  inv RECORD;
  result JSON;
BEGIN
  -- Find the invitation
  SELECT * INTO inv FROM invitations 
  WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
  
  IF inv IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Update invitation status
  UPDATE invitations 
  SET status = 'accepted', accepted_at = NOW() 
  WHERE id = inv.id;
  
  -- Update user profile to student role
  UPDATE user_profiles 
  SET role = 'student', 
      coach_id = inv.coach_id,
      client_id = inv.client_id,
      updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN json_build_object(
    'success', true, 
    'coach_id', inv.coach_id,
    'client_id', inv.client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to preview invitation by token without exposing full invitations table
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
  FROM invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(VARCHAR) TO anon, authenticated;

COMMENT ON TABLE user_profiles IS 'Stores user role (coach/student/admin) and relationships';
COMMENT ON TABLE invitations IS 'Stores pending/accepted invitations from coaches to students';
