-- ============================================
-- STUDENT MODE SCHEMA - PersonalPro
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============ USER PROFILES TABLE ============
-- Stores role information and coach-student relationships
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(20) NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach', 'student')),
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For students: who invited them
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,   -- Links student to their client record
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ INVITATIONS TABLE ============
-- Stores pending invitations sent by coaches to students
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Links to existing client record
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

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Coaches can view their students profiles" ON user_profiles
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "System can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Policies for invitations
CREATE POLICY "Coaches can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Anyone can view invitation by token" ON invitations
  FOR SELECT USING (true); -- Token-based lookup needs public access

-- ============ FUNCTIONS ============

-- Function to automatically create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'coach'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to accept invitation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ HELPER VIEWS ============

-- View for coaches to see their students
CREATE OR REPLACE VIEW coach_students AS
SELECT 
  up.id as student_user_id,
  up.full_name as student_name,
  up.avatar_url as student_avatar,
  up.created_at as joined_at,
  c.id as client_id,
  c.name as client_name,
  c.goal,
  c.level,
  c.adherence,
  c.status as client_status
FROM user_profiles up
LEFT JOIN clients c ON up.client_id = c.id
WHERE up.role = 'student';

COMMENT ON TABLE user_profiles IS 'Stores user role (coach/student/admin) and relationships';
COMMENT ON TABLE invitations IS 'Stores pending/accepted invitations from coaches to students';
