// Gemini Service - Secure API via Edge Function
// API calls are proxied through Supabase Edge Function to protect the API key

import { logAIAction } from './loggingService';
import { supabase } from './supabaseClient';
import { buildEdgeAuthHeaders } from './ai/providers/edgeHeaders';
import {
  ExerciseReplacementSchema,
  extractLikelyJson,
  formatSchemaError,
  IntentionResponseSchema,
  ProgressAnalysisSchema,
  RefinedWorkoutSchema,
  WorkoutProgramSchema
} from './ai/responseSchemas';

// Supabase URL for Edge Function
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const GEMINI_PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

// Check if we're in development mode
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

if (isDev) {
  console.log('🔍 Gemini Service: Using secure Edge Function proxy');
}

// Response interface from Edge Function
interface GeminiProxyResponse {
  success: boolean;
  text?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
  details?: string;
}

// Error types for user-friendly messages
export interface AIError {
  type: 'rate_limit' | 'quota_exceeded' | 'network' | 'parse' | 'unknown';
  message: string;
  userMessage: string;
  retryAfter?: number;
}

// Helper to create friendly error messages
export function handleAIError(error: any): AIError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';

  // Rate limit / Quota exceeded (429)
  if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      type: 'quota_exceeded',
      message: errorMessage,
      userMessage: '⏳ Limite de requisições atingido. Aguarde 1 minuto e tente novamente.',
      retryAfter: 60
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: '🌐 Erro de conexão. Verifique sua internet e tente novamente.'
    };
  }

  // JSON parse errors
  if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Unexpected')) {
    return {
      type: 'parse',
      message: errorMessage,
      userMessage: '🤖 A IA retornou uma resposta inválida. Tente novamente.'
    };
  }

  // Unknown
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: '❌ Erro inesperado. Usando geração local.'
  };
}

// Estimate tokens (~4 characters per token on average)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function getEdgeAuthHeaders(): Promise<Record<string, string> | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return buildEdgeAuthHeaders(
    session?.access_token,
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || ''
  );
}

// Call Gemini via Edge Function
async function callGeminiWithFallback(prompt: string, action?: string): Promise<{
  text: string | null;
  model: string | null;
  latencyMs: number;
  tokensInput: number;
  tokensOutput: number;
}> {
  const startTime = Date.now();
  const tokensInput = estimateTokens(prompt);

  if (!SUPABASE_URL) {
    console.warn('⚠️ Supabase URL not configured - AI unavailable');
    return { text: null, model: null, latencyMs: Date.now() - startTime, tokensInput, tokensOutput: 0 };
  }

  try {
    if (isDev) console.log('🚀 Calling Gemini via Edge Function...');
    const authHeaders = await getEdgeAuthHeaders();
    if (!authHeaders) {
      return { text: null, model: null, latencyMs: Date.now() - startTime, tokensInput, tokensOutput: 0 };
    }

    const response = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ prompt, action }),
    });

    const data: GeminiProxyResponse = await response.json();
    const latencyMs = data.latencyMs || (Date.now() - startTime);

    if (data.success && data.text) {
      const tokensOutput = estimateTokens(data.text);
      if (isDev) console.log(`✅ Gemini succeeded via ${data.model} (${latencyMs}ms)`);
      return {
        text: data.text,
        model: data.model || 'gemini-proxy',
        latencyMs,
        tokensInput,
        tokensOutput
      };
    } else {
      console.warn('❌ Gemini proxy failed:', data.error || 'Unknown error');
      return { text: null, model: null, latencyMs, tokensInput, tokensOutput: 0 };
    }
  } catch (error: any) {
    console.error('❌ Error calling Gemini proxy:', error?.message);
    return { text: null, model: null, latencyMs: Date.now() - startTime, tokensInput, tokensOutput: 0 };
  }
}

// Enhanced workout generation with rich client data
interface ClientWorkoutData {
  name: string;
  goal: string;
  level: string;
  days: number;
  observations?: string;
  injuries?: string;
  preferences?: string;
  adherence?: number;
  equipment?: string[];
  sessionDuration?: number; // minutes
  previousWorkouts?: { name: string; date: string }[];
  recentProgress?: string;
}

export async function generateWorkoutWithAI(
  clientName: string,
  goal: string,
  level: string,
  days: number,
  observations: string,
  extendedData?: Partial<ClientWorkoutData>
): Promise<any> {
  try {
    // Build rich context
    const injuries = extendedData?.injuries || 'Nenhuma';
    const preferences = extendedData?.preferences || 'Não especificadas';
    const adherence = extendedData?.adherence || 80;
    const equipment = extendedData?.equipment?.join(', ') || 'Academia completa';
    const sessionDuration = extendedData?.sessionDuration || 60;
    const previousWorkouts = extendedData?.previousWorkouts?.slice(0, 3) || [];
    const recentProgress = extendedData?.recentProgress || '';

    const historyContext = previousWorkouts.length > 0
      ? `HISTÓRICO RECENTE:\n${previousWorkouts.map(w => `- ${w.name} (${w.date})`).join('\n')}`
      : '';

    const prompt = `Você é um personal trainer de elite com 15 anos de experiência. Crie um programa de treino ALTAMENTE PERSONALIZADO.

===== PERFIL DO CLIENTE =====
NOME: ${clientName}
OBJETIVO PRINCIPAL: ${goal}
NÍVEL DE CONDICIONAMENTO: ${level}
FREQUÊNCIA SEMANAL: ${days} dias
TAXA DE ADERÊNCIA: ${adherence}%
DURAÇÃO DA SESSÃO: ${sessionDuration} minutos

===== CONSIDERAÇÕES ESPECIAIS =====
LESÕES/LIMITAÇÕES: ${injuries}
PREFERÊNCIAS DE TREINO: ${preferences}
EQUIPAMENTOS DISPONÍVEIS: ${equipment}
OBSERVAÇÕES DO PERSONAL: ${observations || 'Nenhuma'}

${historyContext}
${recentProgress ? `PROGRESSO RECENTE: ${recentProgress}` : ''}

===== INSTRUÇÕES =====
1. Crie ${days} splits otimizados para o objetivo
2. Adapte o volume baseado na aderência (${adherence}% = ${adherence >= 85 ? 'volume alto' : adherence >= 70 ? 'volume moderado' : 'volume conservador'})
3. EVITE exercícios que agravam: ${injuries}
4. PRIORIZE exercícios que o cliente gosta: ${preferences}
5. Cada sessão deve durar aprox. ${sessionDuration} minutos

Responda APENAS com JSON puro (sem markdown, sem comentários, sem vírgulas extras):
{
  "title": "Protocolo ${goal} - ${clientName}",
  "objective": "Descrição detalhada da estratégia e benefícios esperados",
  "duration": "${sessionDuration} min por sessão",
  "periodization": "Resumo da estratégia de periodização",
  "mesocycle": [
    { "week": 1, "phase": "Fase 1", "focus": "Foco da semana", "instruction": "Instrução de carga/volume" },
    { "week": 2, "phase": "Fase 2", "focus": "Foco da semana", "instruction": "Instrução de carga/volume" },
    { "week": 3, "phase": "Fase 3", "focus": "Foco da semana", "instruction": "Instrução de carga/volume" },
    { "week": 4, "phase": "Deload", "focus": "Recuperação", "instruction": "Instrução de carga/volume" }
  ],
  "splits": [
    {
      "name": "Treino A",
      "focus": "Foco do treino",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": 4,
          "reps": "8-12",
          "rest": "60s",
          "targetMuscle": "Músculo alvo",
          "technique": "Dica de execução"
        }
      ]
    }
  ]
}

Crie exercícios específicos, variados e adequados ao perfil. Seja criativo nos nomes dos treinos.`;

    const { text, model, latencyMs, tokensInput, tokensOutput } = await callGeminiWithFallback(prompt, 'generate_workout');

    if (!text) {
      // Log failure
      logAIAction({
        action_type: 'generate_workout',
        model_used: 'none',
        prompt: prompt.substring(0, 500) + '...',
        response: null,
        latency_ms: latencyMs,
        tokens_input: tokensInput,
        tokens_output: 0,
        success: false,
        error_message: 'API failed',
        metadata: { clientName, goal, level, days }
      });
      return null; // API failed, trigger local fallback
    }

    const cleanText = extractLikelyJson(text);

    try {
      const parsedJson = JSON.parse(cleanText);
      const schemaResult = WorkoutProgramSchema.safeParse(parsedJson);
      if (!schemaResult.success) {
        logAIAction({
          action_type: 'generate_workout',
          model_used: model || 'unknown',
          prompt: prompt.substring(0, 300) + '...',
          response: cleanText.substring(0, 500),
          latency_ms: latencyMs,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          success: false,
          error_message: `Schema validation failed: ${formatSchemaError(schemaResult.error)}`,
          metadata: { clientName, goal, level, days }
        });
        return null;
      }

      const parsedResult = schemaResult.data;

      // VALIDATION: Ensure the result actually has exercises
      const hasExercises = parsedResult.splits?.some((split: any) =>
        split.exercises && Array.isArray(split.exercises) && split.exercises.length > 0
      );

      if (!hasExercises) {
        console.warn("AI returned valid JSON but with empty exercises. Triggering local fallback.");
        // Log this specific failure
        logAIAction({
          action_type: 'generate_workout',
          model_used: model || 'unknown',
          prompt: prompt.substring(0, 300) + '...',
          response: cleanText.substring(0, 500),
          latency_ms: latencyMs,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          success: false,
          error_message: 'Empty exercises array',
          metadata: { clientName, goal, level, days }
        });
        return null; // Force local fallback
      }

      // Log success
      logAIAction({
        action_type: 'generate_workout',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 500) + '...',
        response: cleanText.substring(0, 1000),
        latency_ms: latencyMs,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        success: true,
        metadata: { clientName, goal, level, days }
      });

      return parsedResult;
    } catch (parseError) {
      console.warn("JSON parse failed, triggering local fallback...", parseError);

      // Log parse failure but partial text
      logAIAction({
        action_type: 'generate_workout',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 300) + '...',
        response: cleanText.substring(0, 500),
        latency_ms: latencyMs,
        success: false,
        error_message: 'JSON Parse Error',
        metadata: { clientName, goal, level, days }
      });

      // KEY FIX: Return null to force AIBuilderView to use the local generator fallback
      // instead of returning an empty/broken workout.
      return null;
    }
  } catch (error) {
    console.error("Error generating workout with AI:", error);
    return null; // Returns null to trigger fallback
  }
}

// Streaming version for real-time UI updates
export async function* generateWorkoutWithAIStream(
  clientName: string,
  goal: string,
  level: string,
  days: number,
  observations: string
): AsyncGenerator<string, void, unknown> {
  // Streaming not supported via Edge Function - use regular call
  yield '{"info": "Streaming not available via Edge Function, using standard call"}';
  return;
}

// Analyze client progress over time
export async function analyzeClientProgress(clientData: {
  name: string;
  assessments: Array<{
    date: string;
    weight?: number;
    bodyFat?: number;
    measures?: Record<string, number>;
  }>;
  workoutHistory?: Array<{ date: string; completed: boolean }>;
  goal: string;
}): Promise<{
  summary: string;
  improvements: string[];
  concerns: string[];
  recommendations: string[];
} | null> {
  try {
    const prompt = `Analise o progresso do cliente ${clientData.name} (objetivo: ${clientData.goal}).

    DADOS DE AVALIAÇÕES:
    ${JSON.stringify(clientData.assessments, null, 2)}

    HISTÓRICO DE TREINOS:
    ${clientData.workoutHistory ? `${clientData.workoutHistory.filter(w => w.completed).length} treinos completados` : 'Não disponível'}

    Faça uma análise profissional. Responda APENAS com JSON:
    {
      "summary": "Resumo geral do progresso em 2-3 frases",
      "improvements": ["Pontos de melhoria observados"],
      "concerns": ["Pontos de atenção/preocupação"],
      "recommendations": ["Recomendações específicas para evoluir"]
    }`;

    const { text, model, latencyMs } = await callGeminiWithFallback(prompt, 'analyze_progress');

    if (!text) {
      return {
        summary: `${clientData.name} está progredindo. Continue o bom trabalho!`,
        improvements: ['Consistência nos treinos'],
        concerns: [],
        recommendations: ['Manter a rotina atual']
      };
    }

    const cleanText = extractLikelyJson(text);
    const parsedJson = JSON.parse(cleanText);
    const schemaResult = ProgressAnalysisSchema.safeParse(parsedJson);

    if (!schemaResult.success) {
      logAIAction({
        action_type: 'analyze_progress',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 300) + '...',
        response: cleanText.substring(0, 500),
        latency_ms: latencyMs,
        success: false,
        error_message: `Schema validation failed: ${formatSchemaError(schemaResult.error)}`,
        metadata: { clientName: clientData.name }
      });
      return {
        summary: `${clientData.name} está progredindo. Continue o bom trabalho!`,
        improvements: ['Consistência nos treinos'],
        concerns: [],
        recommendations: ['Manter a rotina atual']
      };
    }

    // Log success
    logAIAction({
      action_type: 'analyze_progress',
      model_used: model || 'unknown',
      prompt: prompt.substring(0, 300) + '...',
      response: cleanText.substring(0, 500),
      latency_ms: latencyMs,
      success: true,
      metadata: { clientName: clientData.name }
    });
    return schemaResult.data;
  } catch (error) {
    console.error("Error analyzing progress:", error);
    return {
      summary: `${clientData.name} está progredindo. Continue o bom trabalho!`,
      improvements: ['Consistência nos treinos'],
      concerns: [],
      recommendations: ['Manter a rotina atual']
    };
  }
}

export async function regenerateExerciseWithAI(
  currentExercise: string,
  targetMuscle: string,
  goal: string,
  injuries: string,
  equipment: string = 'Academia completa'
): Promise<any> {
  try {
    const prompt = `Atue como um treinador especialista. Sugira UMA alternativa excelente para substituir o exercício "${currentExercise}" (foco: ${targetMuscle}).

    CONTEXTO:
    - Objetivo: ${goal}
    - Equipamentos: ${equipment}
    - Lesões a evitar: ${injuries || 'Nenhuma'}

    A alternativa deve ser biomecanicamente similar mas oferecer um estímulo diferente.
    Responda APENAS com JSON (sem markdown):
    {
      "name": "Nome do Novo Exercício",
      "sets": 4,
      "reps": "8-12",
      "rest": "60s",
      "targetMuscle": "${targetMuscle}",
      "technique": "Dica rápida de execução"
    }`;

    const { text, model, latencyMs } = await callGeminiWithFallback(prompt, 'regenerate_exercise');

    if (!text) return null;
    const cleanText = extractLikelyJson(text);
    const parsedJson = JSON.parse(cleanText);
    const schemaResult = ExerciseReplacementSchema.safeParse(parsedJson);

    if (!schemaResult.success) {
      logAIAction({
        action_type: 'regenerate_exercise',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 300),
        response: cleanText.substring(0, 500),
        latency_ms: latencyMs,
        success: false,
        error_message: `Schema validation failed: ${formatSchemaError(schemaResult.error)}`,
        metadata: { currentExercise, targetMuscle, goal }
      });
      return null;
    }

    // Log success
    logAIAction({
      action_type: 'regenerate_exercise',
      model_used: model || 'unknown',
      prompt: prompt.substring(0, 300),
      response: cleanText,
      latency_ms: latencyMs,
      success: true,
      metadata: { currentExercise, targetMuscle, goal }
    });

    return schemaResult.data;
  } catch (error) {
    console.error("Error regenerating exercise:", error);
    return null;
  }
}

export async function refineWorkoutWithAI(
  currentWorkout: any,
  instruction: string
): Promise<any> {
  try {
    const prompt = `Você é um editor de treinos especialista.
    
    TREINO ATUAL (JSON):
    ${JSON.stringify(currentWorkout)}

    INSTRUÇÃO DE ALTERAÇÃO:
    "${instruction}"

    Modifique o JSON do treino para atender exatamente à instrução. Mantenha a estrutura, apenas altere o necessário.
    Se a instrução for "Adicionar exercício", insira-o no split mais apropriado.
    
    Responda APENAS com o JSON modificado válido (sem markdown).`;

    const { text, model, latencyMs } = await callGeminiWithFallback(prompt, 'refine_workout');

    if (!text) return null;
    const cleanText = extractLikelyJson(text);
    const parsedJson = JSON.parse(cleanText);
    const schemaResult = RefinedWorkoutSchema.safeParse(parsedJson);

    if (!schemaResult.success) {
      logAIAction({
        action_type: 'refine',
        model_used: model || 'unknown',
        prompt: instruction,
        response: cleanText.substring(0, 500),
        latency_ms: latencyMs,
        success: false,
        error_message: `Schema validation failed: ${formatSchemaError(schemaResult.error)}`
      });
      return null;
    }

    // Log refine action
    logAIAction({
      action_type: 'refine',
      model_used: model || 'unknown',
      prompt: instruction,
      response: cleanText.substring(0, 500),
      latency_ms: latencyMs,
      success: true
    });
    return schemaResult.data;
  } catch (error) {
    console.error("Error refining workout:", error);
    return null;
  }
}

export async function getAIInsight(clientData: {
  name: string;
  adherence: number;
  lastTraining: string;
  daysWithoutTraining?: number;
}): Promise<string> {
  // Fallback insights
  const getFallbackInsight = () => {
    if (clientData.adherence < 30) {
      return `⚠️ ${clientData.name} está com aderência baixa (${clientData.adherence}%). Considere entrar em contato para motivação.`;
    }
    return `✅ ${clientData.name} está progredindo bem com ${clientData.adherence}% de aderência.`;
  };

  try {
    const prompt = `Você é um assistente de personal trainer. Analise este aluno e dê um insight breve (máximo 2 frases) em português:

Nome: ${clientData.name}
Aderência: ${clientData.adherence}%
Último treino: ${clientData.lastTraining}
${clientData.daysWithoutTraining ? `Dias sem treinar: ${clientData.daysWithoutTraining}` : ''}

Seja direto e acionável. Use emojis apropriados.`;

    const { text } = await callGeminiWithFallback(prompt, 'get_insight');

    return text || getFallbackInsight();
  } catch (error) {
    console.error("Error getting AI insight:", error);
    return getFallbackInsight();
  }
}

export async function generateMessageTemplate(
  type: 'reminder' | 'motivation' | 'billing' | 'congratulation',
  clientName: string,
  extraData?: any
): Promise<string> {
  const fallbackMessages: Record<string, string> = {
    reminder: `Olá ${clientName}! 👋\n\nPassando para lembrar do seu treino de hoje! 💪\n\nTe vejo na academia!\n\nAbraços,\nRodrigo`,
    motivation: `Ei ${clientName}! 🔥\n\nSei que às vezes é difícil, mas lembre-se: cada treino conta! Você está construindo a melhor versão de você mesmo.\n\nBora manter o foco! 💪`,
    billing: `Olá ${clientName}! 👋\n\nEspero que esteja bem! Passando para lembrar da sua mensalidade.\n\nQualquer dúvida, estou à disposição!\n\nAbraços,\nRodrigo`,
    congratulation: `Parabéns ${clientName}! 🎉\n\nVocê está arrasando nos treinos! Continue assim que os resultados vão aparecer.\n\n💪🔥`
  };

  try {
    const typeDescriptions: Record<string, string> = {
      reminder: 'lembrete de treino',
      motivation: 'mensagem motivacional',
      billing: 'lembrete de pagamento',
      congratulation: 'parabenização por conquista'
    };

    const prompt = `Crie uma mensagem de ${typeDescriptions[type]} para WhatsApp para o aluno ${clientName}.
${extraData ? `Informação adicional: ${JSON.stringify(extraData)}` : ''}

A mensagem deve ser:
- Curta e direta
- Profissional mas amigável
- Com emojis apropriados
- Assinada por "Rodrigo"

Responda apenas com a mensagem, sem explicações.`;

    const { text } = await callGeminiWithFallback(prompt, 'generate_message');

    return text || fallbackMessages[type];
  } catch (error) {
    console.error("Error generating message:", error);
    return fallbackMessages[type];
  }
}

// Check if AI is available (Edge Function configured)
export function isAIAvailable(): boolean {
  return !!SUPABASE_URL;
}

// ============================================================
// INTENTION-BASED WORKOUT GENERATION (Phase 2 - New approach)
// IA returns movement patterns, system resolves to real exercises
// ============================================================

import {
  resolveExercise,
  parseClientInjuries,
  type Exercise
} from './exerciseService';

// Types for intention-based generation
interface IntentionWorkoutData {
  name: string;
  goal: string;
  level: string;
  days: number;
  injuries?: string;
  preferences?: string;
  adherence?: number;
  equipment?: string[];
  sessionDuration?: number;
}

/**
 * NEW: Generate workout by intention
 * IA returns abstract intentions, system resolves to real exercises
 * This eliminates the problem of IA inventing non-existent exercises
 */
export async function generateWorkoutByIntention(
  clientData: IntentionWorkoutData
): Promise<{
  title: string;
  objective: string;
  splits: Array<{
    name: string;
    focus: string;
    exercises: Array<{
      exercise: Exercise;
      sets: number;
      reps: string;
      rest: string;
      method?: string;
      notes?: string;
    }>;
  }>;
} | null> {
  try {
    const injuries = clientData.injuries || 'Nenhuma';
    const preferences = clientData.preferences || 'Não especificadas';
    const adherence = clientData.adherence || 80;
    const equipment = clientData.equipment?.join(', ') || 'Academia completa';
    const sessionDuration = clientData.sessionDuration || 60;

    // Parse injuries for resolution
    const parsedInjuries = parseClientInjuries(injuries);

    const prompt = `Você é um personal trainer de elite. Crie um programa de treino PERSONALIZADO.

===== PERFIL =====
NOME: ${clientData.name}
OBJETIVO: ${clientData.goal}
NÍVEL: ${clientData.level}
FREQUÊNCIA: ${clientData.days} dias/semana
ADERÊNCIA: ${adherence}%
DURAÇÃO: ${sessionDuration} min

===== RESTRIÇÕES =====
LESÕES: ${injuries}
PREFERÊNCIAS: ${preferences}
EQUIPAMENTOS: ${equipment}

===== INSTRUÇÕES CRÍTICAS =====
Você NÃO deve retornar nomes de exercícios.
Retorne apenas INTENÇÕES BIOMECÂNICAS que o sistema vai resolver.

Padrões de movimento disponíveis:
- empurrar_horizontal (supino, flexão)
- empurrar_vertical (desenvolvimento)
- puxar_horizontal (remada)
- puxar_vertical (puxada)
- agachar (agachamento, leg press)
- hinge (stiff, terra, hip thrust)
- core (prancha, abdominal)

Músculos principais:
- peito, ombro, costas, quadriceps, posterior_coxa, gluteos, core

EVITE padrões que agravam: ${injuries}

Responda APENAS com JSON puro:
{
  "title": "Nome do Protocolo",
  "objective": "Estratégia geral",
  "splits": [
    {
      "name": "Treino A",
      "focus": "Superior - Push",
      "intentions": [
        {
          "movement_pattern": "empurrar_horizontal",
          "primary_muscle": "peito",
          "sets": 4,
          "reps": "8-12",
          "rest": "60s",
          "method": "simples",
          "notes": "Foco em contração"
        }
      ]
    }
  ]
}

Crie ${clientData.days} splits com 5-7 intenções cada.`;

    const { text, model, latencyMs, tokensInput, tokensOutput } = await callGeminiWithFallback(prompt, 'generate_workout_intention');

    if (!text) {
      logAIAction({
        action_type: 'generate_workout_intention',
        model_used: 'none',
        prompt: prompt.substring(0, 500) + '...',
        response: null,
        latency_ms: latencyMs,
        tokens_input: tokensInput,
        tokens_output: 0,
        success: false,
        error_message: 'API failed',
        metadata: { clientName: clientData.name, goal: clientData.goal }
      });
      return null;
    }

    const cleanText = extractLikelyJson(text);

    try {
      const parsedJson = JSON.parse(cleanText);
      const schemaResult = IntentionResponseSchema.safeParse(parsedJson);
      if (!schemaResult.success) {
        logAIAction({
          action_type: 'generate_workout_intention',
          model_used: model || 'unknown',
          prompt: prompt.substring(0, 300) + '...',
          response: cleanText.substring(0, 500),
          latency_ms: latencyMs,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          success: false,
          error_message: `Schema validation failed: ${formatSchemaError(schemaResult.error)}`,
          metadata: { clientName: clientData.name }
        });
        return null;
      }

      const aiResponse = schemaResult.data;

      // RESOLVE: Transform intentions into real exercises
      const resolvedSplits = await Promise.all(
        aiResponse.splits.map(async (split) => {
          const resolvedExercises = await Promise.all(
            split.intentions.map(async (intention) => {
              const exercises = await resolveExercise({
                movement_pattern: intention.movement_pattern,
                primary_muscle: intention.primary_muscle,
                avoid_injuries: parsedInjuries,
                prefer_compound: true
              });

              // Pick first match or null
              const exercise = exercises[0] || null;

              return exercise ? {
                exercise,
                sets: intention.sets,
                reps: intention.reps,
                rest: intention.rest,
                method: intention.method,
                notes: intention.notes
              } : null;
            })
          );

          return {
            name: split.name,
            focus: split.focus,
            exercises: resolvedExercises.filter(Boolean) as Array<{
              exercise: Exercise;
              sets: number;
              reps: string;
              rest: string;
              method?: string;
              notes?: string;
            }>
          };
        })
      );

      // Validate we have exercises
      const hasExercises = resolvedSplits.some(s => s.exercises.length > 0);

      if (!hasExercises) {
        logAIAction({
          action_type: 'generate_workout_intention',
          model_used: model || 'unknown',
          prompt: prompt.substring(0, 300) + '...',
          response: cleanText.substring(0, 500),
          latency_ms: latencyMs,
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          success: false,
          error_message: 'No exercises resolved from intentions',
          metadata: { clientName: clientData.name }
        });
        return null;
      }

      // Log success
      logAIAction({
        action_type: 'generate_workout_intention',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 300) + '...',
        response: cleanText.substring(0, 500),
        latency_ms: latencyMs,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        success: true,
        metadata: {
          clientName: clientData.name,
          intentionsCount: aiResponse.splits.reduce((acc, s) => acc + s.intentions.length, 0),
          resolvedCount: resolvedSplits.reduce((acc, s) => acc + s.exercises.length, 0)
        }
      });

      return {
        title: aiResponse.title,
        objective: aiResponse.objective,
        splits: resolvedSplits
      };

    } catch (parseError) {
      console.warn('Intention JSON parse failed:', parseError);
      logAIAction({
        action_type: 'generate_workout_intention',
        model_used: model || 'unknown',
        prompt: prompt.substring(0, 300) + '...',
        response: cleanText.substring(0, 300),
        latency_ms: latencyMs,
        success: false,
        error_message: 'JSON Parse Error'
      });
      return null;
    }

  } catch (error) {
    console.error('Error generating workout by intention:', error);
    return null;
  }
}
// Security update
