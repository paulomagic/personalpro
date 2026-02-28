export interface InvitationPreview {
    id: string;
    email: string;
    client_id?: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expires_at: string;
}

interface AcceptInvitationPayload {
    success?: boolean;
    error?: string;
}

export function normalizeInvitationPreviewFromRpc(data: unknown): InvitationPreview | null {
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0] as Record<string, unknown> | null | undefined;
    if (!first || typeof first !== 'object') return null;

    const id = first.id;
    const email = first.email;
    const status = first.status;
    const expiresAt = first.expires_at;
    const clientId = first.client_id;

    if (
        typeof id !== 'string'
        || typeof email !== 'string'
        || (status !== 'pending' && status !== 'accepted' && status !== 'expired' && status !== 'cancelled')
        || typeof expiresAt !== 'string'
    ) {
        return null;
    }

    return {
        id,
        email,
        status,
        expires_at: expiresAt,
        client_id: typeof clientId === 'string' ? clientId : undefined,
    };
}

export function normalizeAcceptInvitationResult(data: unknown): { success: boolean; error?: string } {
    const payload = (data || {}) as AcceptInvitationPayload;
    if (payload.success) {
        return { success: true };
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
        return { success: false, error: payload.error };
    }
    return { success: false, error: 'Convite inválido ou expirado' };
}
