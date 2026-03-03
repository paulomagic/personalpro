import { z } from 'zod';
import { AIIntentResponseSchema } from './types';

export const WorkoutExerciseSchema = z.object({
  name: z.string().min(2),
  sets: z.coerce.number().int().min(1).max(12),
  reps: z.string().min(1),
  rest: z.string().min(1),
  targetMuscle: z.string().min(1),
  technique: z.string().min(1).optional(),
}).passthrough();

export const WorkoutSplitSchema = z.object({
  name: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(WorkoutExerciseSchema).min(1),
}).passthrough();

export const WorkoutMesocycleSchema = z.object({
  week: z.coerce.number().int().min(1).max(16),
  phase: z.string().min(1),
  focus: z.string().min(1),
  instruction: z.string().min(1),
}).passthrough();

export const WorkoutProgramSchema = z.object({
  title: z.string().min(2),
  objective: z.string().min(2),
  duration: z.string().min(2).optional(),
  periodization: z.string().optional(),
  mesocycle: z.array(WorkoutMesocycleSchema).optional(),
  splits: z.array(WorkoutSplitSchema).min(1),
}).passthrough();

export const ProgressAnalysisSchema = z.object({
  summary: z.string().min(3),
  improvements: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
}).passthrough();

export const ExerciseReplacementSchema = z.object({
  name: z.string().min(2),
  sets: z.coerce.number().int().min(1).max(12),
  reps: z.string().min(1),
  rest: z.string().min(1),
  targetMuscle: z.string().min(1),
  technique: z.string().optional(),
}).passthrough();

export const RefinedWorkoutSchema = z.object({
  splits: z.array(WorkoutSplitSchema).min(1),
}).passthrough();

export const IntentionResponseSchema = AIIntentResponseSchema;

export function extractLikelyJson(rawText: string): string {
  let cleanText = rawText.trim();

  cleanText = cleanText
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();

  const jsonStart = cleanText.indexOf('{');
  const jsonEnd = cleanText.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
  }

  return cleanText
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/\t/g, ' ');
}

export function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
    .join(' | ');
}
