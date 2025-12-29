
// ============ USER TYPE ============
export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
  };
  created_at?: string;
}

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
  ASSESSMENT = 'ASSESSMENT',
  STUDENT = 'STUDENT',
  SPORT_TRAINING = 'SPORT_TRAINING',
  // Admin Views
  ADMIN = 'ADMIN',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_AI_LOGS = 'ADMIN_AI_LOGS',
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
  goal: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta';
  adherence: number;
  lastTraining: string;
  status: 'active' | 'at-risk' | 'inactive' | 'paused';
  email?: string;
  phone?: string;
  birthDate?: string;
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
  title: string;
  exercises: WorkoutExercise[] | Exercise[];
  objective: string;
  duration: string;
  days: number;
  splits?: WorkoutSplit[];  // Treino A, B, C... com exercícios separados
  isTemplate?: boolean;
  templateId?: string;
  sportParams?: SportTrainingParams;  // Premium: Para treinos esportivos
}
