import { supabase } from '../../supabaseCore';

const QUEUE_KEY = 'personalpro_ai_generation_feedback_queue_v1';

type FeedbackKind = 'positive' | 'negative';

interface AIGenerationFeedbackPayload {
    feedback: FeedbackKind;
    clientId?: string;
    workoutTitle?: string;
    optionLabel?: string;
    objective?: string;
    source: 'ai_builder';
}

interface QueuedItem {
    id: string;
    payload: AIGenerationFeedbackPayload;
    createdAt: string;
    attempts: number;
}

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readQueue(): QueuedItem[] {
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeQueue(items: QueuedItem[]): void {
    if (!canUseStorage()) return;
    try {
        window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    } catch {
        // noop
    }
}

async function insertFeedbackLog(payload: AIGenerationFeedbackPayload): Promise<boolean> {
    if (!supabase) return false;

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    const promptText = `feedback:${payload.feedback};source:${payload.source};client:${payload.clientId || 'unknown'}`;

    const { error } = await supabase.from('ai_logs').insert({
        user_id: userId,
        action_type: 'generate_workout',
        model_used: 'feedback',
        prompt: promptText.slice(0, 500),
        response: null,
        latency_ms: 0,
        success: true,
        metadata: {
            feedback: payload.feedback,
            source: payload.source,
            client_id: payload.clientId || null,
            workout_title: payload.workoutTitle || null,
            option_label: payload.optionLabel || null,
            objective: payload.objective || null,
            recorded_at: new Date().toISOString()
        }
    });

    return !error;
}

export async function saveAIGenerationFeedback(
    payload: AIGenerationFeedbackPayload
): Promise<{ success: boolean; queued?: boolean }> {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!online || !supabase) {
        const queue = readQueue();
        queue.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            payload,
            createdAt: new Date().toISOString(),
            attempts: 0
        });
        writeQueue(queue);
        return { success: true, queued: true };
    }

    const persisted = await insertFeedbackLog(payload);
    if (persisted) return { success: true };

    const queue = readQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0
    });
    writeQueue(queue);
    return { success: true, queued: true };
}

export async function flushAIGenerationFeedbackQueue(maxItems = 20): Promise<{ processed: number; remaining: number }> {
    const queue = readQueue();
    if (!queue.length || !supabase) {
        return { processed: 0, remaining: queue.length };
    }

    const processing = queue.slice(0, maxItems);
    const rest = queue.slice(maxItems);
    const failed: QueuedItem[] = [];
    let processed = 0;

    for (const item of processing) {
        const ok = await insertFeedbackLog(item.payload);
        if (ok) {
            processed += 1;
        } else {
            failed.push({ ...item, attempts: item.attempts + 1 });
        }
    }

    writeQueue([...failed, ...rest]);
    return { processed, remaining: failed.length + rest.length };
}
