// Feedback System - Adaptive Progression Module
// Export all feedback-related functionality

export { type SessionFeedback, type ProgressionAdjustment, type ProgressionConfig, type ProgressionHistory, DEFAULT_PROGRESSION_CONFIG } from './types';

export { analyzeSessionFeedback, analyzeTrend, calculateLoadFromRPE } from './adaptiveProgression';

export { saveSessionFeedback, getExerciseFeedbackHistory, getLatestFeedback, getProgressionSuggestion, getProgressionTrend, getAverageRIRByExercise } from './feedbackService';
