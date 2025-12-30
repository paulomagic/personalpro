// Gemini Service - Secure API via Edge Function
// API calls are proxied through Supabase Edge Function to protect the API key

import { logAIAction } from './loggingService';

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

    const response = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    // Clean up the response - remove markdown code blocks if present
    let cleanText = text.trim();

    // Remove markdown code blocks
    cleanText = cleanText.replace(/```json\n?/gi, '');
    cleanText = cleanText.replace(/```\n?/gi, '');
    cleanText = cleanText.trim();

    // Try to find JSON object boundaries
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
    }

    // Fix common JSON issues
    cleanText = cleanText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\n/g, ' ')      // Remove newlines inside strings
      .replace(/\t/g, ' ');     // Remove tabs

    try {
      const parsedResult = JSON.parse(cleanText);

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

    let cleanText = text.replace(/```json|```/g, '').trim();

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
    return JSON.parse(cleanText);
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
    let cleanText = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

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

    return result;
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

    // Log refine action
    logAIAction({
      action_type: 'refine',
      model_used: model || 'unknown',
      prompt: instruction,
      response: text.substring(0, 500),
      latency_ms: latencyMs,
      success: true
    });
    let cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
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
// Security update
