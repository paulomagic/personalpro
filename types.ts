
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
  FINANCE = 'FINANCE'
}

export interface Client {
  id: string;
  name: string;
  avatar: string;
  goal: string;
  level: string;
  adherence: number;
  lastTraining: string;
  status: 'active' | 'at-risk' | 'inactive';
}

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
  exercises: Exercise[];
  objective: string;
  duration: string;
}
