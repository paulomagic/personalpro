-- Migration: Add Workout Session Feedback System
-- Purpose: Enable adaptive progression through RPE/RIR feedback collection
-- Author: Antigravity AI (Database Admin Skill)
-- Date: 2026-01-27

-- ============================================================
-- TABLE: workout_session_feedback
-- ============================================================
-- Stores post-session feedback for adaptive progression
-- Tracks executed sets, reps, load, and perceived exertion

CREATE TABLE IF NOT EXISTS workout_session_feedback (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE SET NULL,
  
  -- Session Data
  session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Execution Data
  sets_completed INTEGER NOT NULL CHECK (sets_completed > 0 AND sets_completed <= 10),
  reps_completed INTEGER[] NOT NULL CHECK (array_length(reps_completed, 1) > 0),
  load_used DECIMAL(6,2) NOT NULL CHECK (load_used >= 0),
  
  -- Perceived Exertion (Optional)
  rpe DECIMAL(3,1) CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  rir INTEGER CHECK (rir IS NULL OR (rir >= 0 AND rir <= 5)),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reps_array CHECK (
    array_length(reps_completed, 1) = sets_completed
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Optimized for common query patterns

-- Query by workout (most common)
CREATE INDEX idx_feedback_workout 
  ON workout_session_feedback(workout_id);

-- Query by student (for trend analysis)
CREATE INDEX idx_feedback_student 
  ON workout_session_feedback(student_id);

-- Query by exercise (for exercise-specific progression)
CREATE INDEX idx_feedback_exercise 
  ON workout_session_feedback(exercise_id);

-- Query by date (for temporal analysis)
CREATE INDEX idx_feedback_date 
  ON workout_session_feedback(session_date DESC);

-- Composite index for student + exercise + date (trend analysis)
CREATE INDEX idx_feedback_student_exercise_date 
  ON workout_session_feedback(student_id, exercise_id, session_date DESC);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON workout_session_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Ensure students can only access their own feedback

ALTER TABLE workout_session_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own feedback
CREATE POLICY "Students can view own feedback"
  ON workout_session_feedback
  FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Students can insert their own feedback
CREATE POLICY "Students can insert own feedback"
  ON workout_session_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Policy: Students can update their own feedback
CREATE POLICY "Students can update own feedback"
  ON workout_session_feedback
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Policy: Students can delete their own feedback
CREATE POLICY "Students can delete own feedback"
  ON workout_session_feedback
  FOR DELETE
  USING (auth.uid() = student_id);

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE workout_session_feedback IS 
  'Stores post-session feedback for adaptive progression tracking';

COMMENT ON COLUMN workout_session_feedback.rpe IS 
  'Rating of Perceived Exertion (1-10 scale)';

COMMENT ON COLUMN workout_session_feedback.rir IS 
  'Reps in Reserve (0-5, where 0 = failure)';

COMMENT ON COLUMN workout_session_feedback.reps_completed IS 
  'Array of reps per set, e.g., {12, 10, 9, 8}';

-- ============================================================
-- SAMPLE QUERIES (For Testing)
-- ============================================================

-- Get latest feedback for a student
-- SELECT * FROM workout_session_feedback 
-- WHERE student_id = 'xxx' 
-- ORDER BY session_date DESC 
-- LIMIT 10;

-- Get trend for specific exercise
-- SELECT session_date, load_used, reps_completed, rir
-- FROM workout_session_feedback
-- WHERE student_id = 'xxx' AND exercise_id = 'yyy'
-- ORDER BY session_date ASC;

-- Average RIR by exercise (for optimization)
-- SELECT exercise_id, AVG(rir) as avg_rir, COUNT(*) as sessions
-- FROM workout_session_feedback
-- WHERE student_id = 'xxx' AND rir IS NOT NULL
-- GROUP BY exercise_id
-- ORDER BY avg_rir DESC;
