
export enum View {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  AI_BUILDER = 'AI_BUILDER',
  CLIENT_PROFILE = 'CLIENT_PROFILE',
  CLIENT_DETAIL = 'CLIENT_DETAIL',
  TRAINING_EXECUTION = 'TRAINING_EXECUTION',
  LOGO_LAB = 'LOGO_LAB',
  CALENDAR = 'CALENDAR',
  CLIENTS = 'CLIENTS',
  METRICS = 'METRICS',
  SETTINGS = 'SETTINGS',
  FINANCE = 'FINANCE',
  WORKOUT_BUILDER = 'WORKOUT_BUILDER',
  ASSESSMENT = 'ASSESSMENT'
}

// Basic Types
export type ExerciseCategory = 'musculacao' | 'funcional' | 'cardio' | 'esporte';
export type TrainingMethod = 'simples' | 'piramide' | 'biset' | 'giantset' | 'dropset';

export interface ExerciseSet {
  method: TrainingMethod;
  reps: string;
  load: string;
  rest: string;
  time?: string; // Para cardio ou isometria
  technique?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  sets: ExerciseSet[];
  notes?: string;
  targetMuscle?: string;
}

export interface Assessment {
  date: string;
  photos: string[]; // URLs
  measures: { [key: string]: number }; // Circunferências
  skinfolds: { [key: string]: number }; // Dobras
  weight: number;
  bodyFat?: number;
}

// Extended Client Interface
export interface Client {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  level: string;
  adherence: number;
  lastTraining: string;
  status: 'active' | 'at-risk' | 'inactive' | 'paused';
  email?: string;
  phone?: string;

  // New MVP Info
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'suspended';
  missedClasses: { date: string; reason: 'sick' | 'travel' | 'other'; replaced: boolean }[];
  assessments: Assessment[];
}

// Legacy Exercise (Deprecate gradually)
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  targetMuscle: string;
}

export interface Workout {
  id: string;
  clientId: string;
  title: string;
  exercises: WorkoutExercise[] | Exercise[]; // Support both for migration
  objective: string;
  duration: string;
  days: number; // Mock field often used
}
