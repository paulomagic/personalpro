-- ============================================
-- FIX: Enable students to view their workouts
-- Execute no Supabase SQL Editor
-- ============================================

-- Add policy for students to view their own workouts
-- Students can view workouts where client_id matches their profile's client_id
CREATE POLICY "Students can view their own workouts" ON workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'student'
        AND user_profiles.client_id = workouts.client_id
    )
  );

-- Também permitir students verem seus clients (para puxar dados biométricos etc)
CREATE POLICY "Students can view their own client record" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'student'
        AND user_profiles.client_id = clients.id
    )
  );
