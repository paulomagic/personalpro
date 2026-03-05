import { supabase } from '../../supabaseCore';
import { readQueueWithFallback, writeQueueWithFallback } from '../../offline/queueStorage';

const QUEUE_KEY = 'personalpro_ai_generation_feedback_queue_v1';
const QUEUE_INDEXEDDB_KEY = 'ai_generation_feedback_queue_v1';
const MAX_QUEUED_ITEMS = 60;
const QUEUE_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_QUEUE_ATTEMPTS = 6;

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

function pruneQueue(items: QueuedItem[]): QueuedItem[] {
    const now = Date.now();
    const filtered = items.filter((item) => {
        const createdAtMs = new Date(item.createdAt).getTime();
        const fresh = Number.isFinite(createdAtMs) && (now - createdAtMs) <= QUEUE_RETENTION_MS;
        const underAttempts = (item.attempts || 0) < MAX_QUEUE_ATTEMPTS;
        return fresh && underAttempts;
    });

    if (filtered.length <= MAX_QUEUED_ITEMS) return filtered;
    return filtered.slice(-MAX_QUEUED_ITEMS);
}

async function readQueue(): Promise<QueuedItem[]> {
    if (typeof window === 'undefined') return [];
    try {
        const queue = await readQueueWithFallback<QueuedItem>(QUEUE_INDEXEDDB_KEY, QUEUE_KEY);
        const pruned = pruneQueue(queue);
        if (pruned.length !== queue.length) {
            await writeQueue(pruned);
        }
        return pruned;
    } catch {
        return [];
    }
}

async function writeQueue(items: QueuedItem[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        await writeQueueWithFallback(QUEUE_INDEXEDDB_KEY, pruneQueue(items), QUEUE_KEY);
    } catch {
        // noop
    }
}

function requestBackgroundSync(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
        .then((registration: ServiceWorkerRegistration) => {
            if (!('sync' in registration)) return;
            return (registration as ServiceWorkerRegistration & {
                sync: { register: (tag: string) => Promise<void> };
            }).sync.register('flush-ai-generation-feedback-queue');
        })
        .catch(() => {
            // noop
        });
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
        const queue = await readQueue();
        queue.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            payload,
            createdAt: new Date().toISOString(),
            attempts: 0
        });
        await writeQueue(queue);
        requestBackgroundSync();
        return { success: true, queued: true };
    }

    const persisted = await insertFeedbackLog(payload);
    if (persisted) return { success: true };

    const queue = await readQueue();
    queue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0
    });
    await writeQueue(queue);
    requestBackgroundSync();
    return { success: true, queued: true };
}

export async function flushAIGenerationFeedbackQueue(maxItems = 20): Promise<{ processed: number; remaining: number }> {
    const queue = await readQueue();
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
            if ((item.attempts || 0) + 1 >= MAX_QUEUE_ATTEMPTS) {
                continue;
            }
            failed.push({ ...item, attempts: item.attempts + 1 });
        }
    }

    await writeQueue([...failed, ...rest]);
    if (failed.length + rest.length > 0) {
        requestBackgroundSync();
    }
    return { processed, remaining: failed.length + rest.length };
}
