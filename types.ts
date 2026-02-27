
// ============ USER TYPE ============
export type UserRole = 'admin' | 'coach' | 'student';

export interface UserProfile {
  id: string;
  role: UserRole;
  coach_id?: string;
  client_id?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invitation {
  id: string;
  coach_id: string;
  email: string;
  client_id?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    role?: UserRole;
  };
  app_metadata?: {
    provider?: string;
  };
  created_at?: string;
  // Extended profile info
  profile?: UserProfile;
}

// Helper function to check if user is admin
export function isAdmin(user: AppUser | any): boolean {
  if (!user) return false;
  // Check user_metadata first (where we store custom roles)
  const role = user?.user_metadata?.role || user?.profile?.role;
  return role === 'admin';
}

// Helper function to check if user is a student (client)
export function isStudent(user: AppUser | any): boolean {
  if (!user) return false;
  const role = user?.user_metadata?.role || user?.profile?.role;
  return role === 'student';
}

// Helper function to check if user is a coach (personal trainer)
export function isCoach(user: AppUser | any): boolean {
  if (!user) return false;
  const role = user?.user_metadata?.role || user?.profile?.role;
  // Default role is coach if not specified
  return role === 'coach' || (!role && !isAdmin(user) && !isStudent(user));
}

export enum View {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  AI_BUILDER = 'AI_BUILDER',
  CLIENT_PROFILE = 'CLIENT_PROFILE',
  CLIENT_DETAIL = 'CLIENT_DETAIL',
  TRAINING_EXECUTION = 'TRAINING_EXECUTION',

  CALENDAR = 'CALENDAR',
  CLIENTS = 'CLIENTS',
  METRICS = 'METRICS',
  SETTINGS = 'SETTINGS',
  FINANCE = 'FINANCE',
  WORKOUT_BUILDER = 'WORKOUT_BUILDER',
  ASSESSMENT = 'ASSESSMENT',
  STUDENT = 'STUDENT',
  STUDENT_PROFILE = 'STUDENT_PROFILE',
  STUDENT_WORKOUTS = 'STUDENT_WORKOUTS',
  SPORT_TRAINING = 'SPORT_TRAINING',
  // Admin Views
  ADMIN = 'ADMIN',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_AI_LOGS = 'ADMIN_AI_LOGS',
  ADMIN_AI_DASHBOARD = 'ADMIN_AI_DASHBOARD',
  ADMIN_ACTIVITY_LOGS = 'ADMIN_ACTIVITY_LOGS',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS'
}

// ============ TRAINING METHODS ============
// MVP Methods
export type MVPTrainingMethod =
  | 'simples'      // Série Normal
  | 'piramide'     // Pirâmide (crescente/decrescente)
  | 'biset'        // Bi-Set / Super Série (2 exercícios)
  | 'giantset';    // Série Gigante (3+ exercícios)

// Premium Methods
export type PremiumTrainingMethod =
  | 'dropset'      // Drop-Set (reduz carga sem descanso)
  | 'restPause'    // Rest-Pause (pausa curta, continua)
  | 'myo'          // Myo Reps
  | 'cluster'      // Cluster Sets
  | 'fst7'         // FST-7 (Fascia Stretch Training)
  | 'gvt'          // German Volume Training (10x10)
  | '21s'          // 21s (7+7+7 parciais)
  | 'mechanical'   // Mechanical Drop Set
  | 'custom';      // Método Personalizado

export type TrainingMethod = MVPTrainingMethod | PremiumTrainingMethod;

// ============ EXERCISE CATEGORIES ============
export type ExerciseCategory =
  | 'musculacao'   // Musculação tradicional
  | 'funcional'    // Exercícios funcionais
  | 'cardio'       // Cardio geral
  | 'escada'       // Escada/StairMaster
  | 'corrida'      // Corrida/Esteira
  | 'esporte'      // Esportes específicos
  | 'mobilidade'   // Alongamento/Mobilidade
  | 'pliometria';  // Exercícios pliométricos

// ============ SPORT TRAINING ============
export type SportType = 'futebol' | 'tenis' | 'natacao' | 'corrida' | 'funcional_esportivo' | 'crossfit';

export interface SportTrainingParams {
  sport: SportType;
  effortZone?: 1 | 2 | 3 | 4 | 5;  // Zona de esforço (1=leve, 5=máximo)
  rpe?: number;                    // Rate of Perceived Exertion (1-10)
  fatigue?: 'low' | 'medium' | 'high';
  oxygenLadder?: boolean;          // Protocolo escada de oxigênio
  intervals?: { work: number; rest: number }[];  // Intervalos em segundos
}

// ============ EXERCISE SET ============
export interface ExerciseSet {
  method: TrainingMethod;
  reps: string;
  load: string;
  rest: string;
  time?: string;           // Para cardio ou isometria
  technique?: string;      // Técnica específica (ex: "cadência 3-1-2")
  rpe?: number;            // Premium: Rate of Perceived Exertion
  effortZone?: number;     // Premium: Zona de esforço cardio
  tempo?: string;          // Premium: Cadência (ex: "3-0-1-0")
  isPartOfSuperset?: boolean;  // Indica se faz parte de bi-set/série gigante
  supersetGroupId?: string;    // ID do grupo de superset
}

// ============ WORKOUT EXERCISE ============
export interface WorkoutExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  sets: ExerciseSet[];
  notes?: string;
  targetMuscle?: string;
  videoUrl?: string;           // Premium: URL do vídeo demonstrativo
  sportParams?: SportTrainingParams;  // Premium: Parâmetros esportivos
  order?: number;              // Ordem no treino
  supersetGroupId?: string;    // ID do grupo se for parte de superset
}

// ============ WORKOUT SPLIT ============
export interface WorkoutSplit {
  id: string;
  name: string;              // "A", "B", "C"...
  description: string;       // "Peito/Tríceps", "Costas/Bíceps", etc.
  exercises: WorkoutExercise[];
}

// ============ ASSESSMENT ============
export interface Assessment {
  id?: string;
  date: string;
  photos: string[];            // URLs das fotos
  videos?: string[];           // Premium: URLs dos vídeos
  measures: { [key: string]: number };    // Circunferências em cm
  skinfolds: { [key: string]: number };   // Dobras cutâneas em mm
  weight: number;
  bodyFat?: number;
  muscleMass?: number;         // Massa muscular
  visceralFat?: number;        // Gordura visceral
  notes?: string;
  comparisonDate?: string;     // Data para comparação lado a lado
}

// ============ MISSED CLASS ============
export interface MissedClass {
  id?: string;
  date: string;
  reason: 'sick' | 'travel' | 'personal' | 'other';
  replaced: boolean;
  replacementDate?: string;
  notes?: string;
}

// ============ PAYMENT RECORD ============
export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'suspended';
  dueDate: string;
  paidDate?: string;
  plan: string;
  suspensionReason?: 'sick' | 'travel' | 'other';
  daysRemaining?: number;
}

// ============ CLIENT ============
export interface Client {
  id: string;
  name: string;
  avatar: string;
  avatar_url?: string;       // Supabase Storage URL (used when updated via upload)
  goal: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta';
  adherence: number;
  lastTraining: string;
  status: 'active' | 'at-risk' | 'inactive' | 'paused';
  email?: string;
  phone?: string;
  birthDate?: string;
  age?: number;             // Idade em anos (calculada ou informada diretamente)
  weight?: number;          // Peso em kg
  height?: number;          // Altura em cm
  bodyFat?: number;         // % de Gordura Corporal
  startDate?: string;

  // Observations & Notes (MVP)
  observations?: string;         // Observações gerais do aluno
  injuries?: string;             // Lesões/Restrições
  preferences?: string;          // Preferências de treino

  // Status Management (MVP)
  suspensionReason?: 'sick' | 'travel' | 'financial' | 'other';
  suspensionStartDate?: string;
  suspensionEndDate?: string;

  // Payment (MVP)
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'suspended';
  paymentHistory?: PaymentRecord[];

  // Classes (MVP)
  missedClasses: MissedClass[];
  totalClasses?: number;
  completedClasses?: number;

  // Assessments
  assessments: Assessment[];

  // Premium: Personal Branding
  coachId?: string;
  coachName?: string;
  coachLogo?: string;

  // Financial fields
  monthly_fee?: number;
  payment_day?: number;
  payment_type?: 'monthly' | 'per_session';
  session_price?: number;
}

// ============ WORKOUT TEMPLATE ============
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'hipertrofia' | 'forca' | 'emagrecimento' | 'condicionamento' | 'esportivo' | 'reabilitacao';
  exercises: WorkoutExercise[];
  duration: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  createdBy: string;           // Coach ID
  isPublic: boolean;           // Pode ser compartilhado
  tags?: string[];
}

// ============ CUSTOM METHOD ============
export interface CustomMethod {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  structure: {
    sets: number;
    repsPattern: string;       // Ex: "12-10-8" ou "até falha"
    restPattern: string;       // Ex: "60s-45s-30s"
    loadPattern?: string;      // Ex: "aumentar 5%" 
    specialInstructions?: string;
  };
  createdBy: string;
}

// ============ PERSONAL BRANDING (Premium) ============
export interface PersonalBrand {
  coachId: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandName?: string;
  tagline?: string;
  watermarkEnabled?: boolean;
}

// ============ LEGACY TYPES ============
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
  studentId?: string;
  title: string;
  exercises: WorkoutExercise[] | Exercise[];
  objective: string;
  duration: string;
  days: number;
  splits?: WorkoutSplit[];  // Treino A, B, C... com exercícios separados
  isTemplate?: boolean;
  templateId?: string;
  sportParams?: SportTrainingParams;  // Premium: Para treinos esportivos
  coldStartMode?: boolean;
  calibrationPlan?: {
    sessions: number;
    objectives?: string[];
  };
  ai_metadata?: {
    model?: string;
    optionSelected?: string;
    generatedAt?: string;
    coldStartMode?: boolean;
    calibrationPlan?: {
      sessions: number;
      objectives?: string[];
    } | null;
    clientData?: {
      injuries?: string;
      preferences?: string;
      adherence?: number;
    };
  };
}

// ============ MONTHLY SCHEDULING ============
export interface MonthlyScheduleTemplate {
  id: string;
  coach_id: string;
  client_id: string;
  name?: string;
  pattern_type: 'weekly' | 'custom' | 'specific_dates';
  week_days?: number[];
  times?: Record<number, string>;
  session_type: 'training' | 'assessment' | 'consultation';
  duration: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface MonthlyScheduleBatch {
  id: string;
  coach_id: string;
  client_id: string;
  month: number;
  year: number;
  total_sessions: number;
  template_id?: string;
  pattern_type?: string;
  week_days?: number[];
  times?: Record<number, string>;
  session_type?: string;
  duration?: string;
  exceptions: string[];
  created_at: string;
  updated_at: string;
}

export interface MonthlyScheduleConfig {
  clientId: string;
  patternType: 'weekly' | 'custom' | 'specific_dates';
  month: number;
  year: number;
  weekDays?: number[];
  times?: Record<number, string>;
  specificDates?: string[];
  sessionType: 'training' | 'assessment' | 'consultation';
  duration: string;
  exceptions?: string[];
  saveAsTemplate?: boolean;
  templateName?: string;
}

export interface ConflictInfo {
  date: string;
  time: string;
  conflictingAppointment: {
    id: string;
    clientName: string;
    type: string;
  };
  suggestedAlternatives: string[];
}

// ============ HISTORY ============
export interface CompletedWorkout {
  id: string;
  client_id: string;
  workout_id?: string;
  title: string;
  date: string;
  duration: string;
  exercises_count: number;
  sets_completed: number;
  total_load_volume: number;
  feedback_notes?: string;
  created_at: string;
}
