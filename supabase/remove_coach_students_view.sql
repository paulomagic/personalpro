-- ============================================
-- REMOVE UNUSED coach_students VIEW
-- Removes the coach_students view that was flagged
-- by Supabase Security Advisor and is not being used
-- ============================================

-- Drop the view if it exists
DROP VIEW IF EXISTS coach_students;

-- Confirmation comment
COMMENT ON SCHEMA public IS 'Removed coach_students view - not used in codebase and flagged by Security Advisor';
