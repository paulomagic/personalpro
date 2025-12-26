
import { GoogleGenAI } from "@google/genai";

// API Key - você pode definir via variável de ambiente ou diretamente aqui
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || '';

let ai: GoogleGenAI | null = null;

try {
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch (e) {
  console.warn('Gemini API not initialized - using fallback');
}

export async function generateWorkoutWithAI(
  clientName: string,
  goal: string,
  level: string,
  days: number,
  observations: string
): Promise<any> {
  if (!ai || !API_KEY) {
    console.log('Using fallback workout generator');
    return null; // Returns null to trigger fallback
  }

  try {
    const prompt = `Você é um personal trainer experiente. Crie um programa de treino personalizado.

CLIENTE: ${clientName}
OBJETIVO: ${goal}
NÍVEL: ${level}
DIAS POR SEMANA: ${days}
OBSERVAÇÕES: ${observations || 'Nenhuma'}

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem explicações):
{
  "title": "Protocolo de ${goal} - ${clientName}",
  "objective": "Descrição breve do objetivo",
  "duration": "Duração estimada do treino",
  "splits": [
    {
      "name": "Treino A - Nome do treino",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": 4,
          "reps": "8-12",
          "rest": "60s",
          "targetMuscle": "Músculo alvo"
        }
      ]
    }
  ]
}

Crie ${days} splits diferentes com 5-6 exercícios cada. Seja específico e profissional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: prompt,
    });

    const text = response.text || '';

    // Clean up the response - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating workout with AI:", error);
    return null; // Returns null to trigger fallback
  }
}

export async function getAIInsight(clientData: {
  name: string;
  adherence: number;
  lastTraining: string;
  daysWithoutTraining?: number;
}): Promise<string> {
  if (!ai || !API_KEY) {
    // Fallback insights
    if (clientData.adherence < 30) {
      return `⚠️ ${clientData.name} está com aderência baixa (${clientData.adherence}%). Considere entrar em contato para motivação.`;
    }
    return `✅ ${clientData.name} está progredindo bem com ${clientData.adherence}% de aderência.`;
  }

  try {
    const prompt = `Você é um assistente de personal trainer. Analise este aluno e dê um insight breve (máximo 2 frases) em português:

Nome: ${clientData.name}
Aderência: ${clientData.adherence}%
Último treino: ${clientData.lastTraining}
${clientData.daysWithoutTraining ? `Dias sem treinar: ${clientData.daysWithoutTraining}` : ''}

Seja direto e acionável. Use emojis apropriados.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: prompt,
    });

    return response.text || 'Análise não disponível';
  } catch (error) {
    console.error("Error getting AI insight:", error);
    if (clientData.adherence < 30) {
      return `⚠️ ${clientData.name} está com aderência baixa. Considere entrar em contato.`;
    }
    return `${clientData.name} está progredindo bem.`;
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

  if (!ai || !API_KEY) {
    return fallbackMessages[type] || fallbackMessages.reminder;
  }

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: prompt,
    });

    return response.text || fallbackMessages[type];
  } catch (error) {
    console.error("Error generating message:", error);
    return fallbackMessages[type];
  }
}

// Check if AI is available
export function isAIAvailable(): boolean {
  return !!ai && !!API_KEY;
}
