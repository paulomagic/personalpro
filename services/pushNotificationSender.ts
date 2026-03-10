import { supabase } from './supabaseCore';

interface SendPushPayload {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
}

export async function sendPushTestNotification(payload: SendPushPayload = {}): Promise<{
    success: boolean;
    message: string;
}> {
    if (!supabase) {
        return { success: false, message: 'Supabase indisponível para enviar push.' };
    }

    const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
            title: payload.title || 'Personal Pro',
            body: payload.body || 'Push de teste enviado com sucesso.',
            url: payload.url || '/settings',
            tag: payload.tag || 'personalpro-test-push',
            data: payload.data || { source: 'settings_test' }
        }
    });

    if (error) {
        return { success: false, message: error.message || 'Falha ao invocar envio de push.' };
    }

    if (!data?.success) {
        return { success: false, message: data?.error || 'Nenhuma assinatura ativa encontrada.' };
    }

    return {
        success: true,
        message: `Push enviado (${data.delivered || 0}/${data.total || 0}).`
    };
}
