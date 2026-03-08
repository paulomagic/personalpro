import React from 'react';
import {
    cancelPrivacyRequest,
    createPrivacyRequest,
    exportMyPrivacyData,
    listPrivacyConsents,
    listPrivacyRequests,
    upsertPrivacyConsent,
    type PrivacyConsentSummary,
    type PrivacyRequestSummary
} from '../services/privacyService';

const PRIVACY_REQUEST_LABELS = {
    access: 'Solicitação de acesso gerada via autoatendimento.',
    delete: 'Solicitação de exclusão de conta aberta pelo titular.',
    rectify: 'Solicitação de retificação cadastral aberta pelo titular.'
} as const;

interface UseSettingsPrivacyParams {
    isDemo: boolean;
    showToast: (message: string, type?: 'success' | 'error') => void;
    onExportDemoFallback: () => void;
    onDownloadExport: (data: unknown) => void;
}

export function useSettingsPrivacy({
    isDemo,
    showToast,
    onExportDemoFallback,
    onDownloadExport
}: UseSettingsPrivacyParams) {
    const [privacyRequests, setPrivacyRequests] = React.useState<PrivacyRequestSummary[]>([]);
    const [privacyConsents, setPrivacyConsents] = React.useState<PrivacyConsentSummary[]>([]);
    const [privacyLoading, setPrivacyLoading] = React.useState(false);
    const [privacyConsentSaving, setPrivacyConsentSaving] = React.useState<string | null>(null);

    const loadPrivacyHistory = React.useCallback(async () => {
        if (isDemo) {
            setPrivacyRequests([]);
            setPrivacyConsents([]);
            return;
        }

        setPrivacyLoading(true);
        try {
            const [requestsResult, consentsResult] = await Promise.all([
                listPrivacyRequests(),
                listPrivacyConsents()
            ]);

            if (!requestsResult.success) {
                showToast(requestsResult.error || 'Erro ao carregar histórico LGPD', 'error');
                return;
            }

            if (!consentsResult.success) {
                showToast(consentsResult.error || 'Erro ao carregar consentimentos', 'error');
                return;
            }

            setPrivacyRequests(requestsResult.data || []);
            setPrivacyConsents(consentsResult.data || []);
        } finally {
            setPrivacyLoading(false);
        }
    }, [isDemo, showToast]);

    const handleExportLivePrivacyData = React.useCallback(async () => {
        if (isDemo) {
            onExportDemoFallback();
            return;
        }

        const result = await exportMyPrivacyData();
        if (!result.success) {
            showToast(result.error || 'Erro ao exportar dados', 'error');
            return;
        }

        onDownloadExport(result.data);
        await loadPrivacyHistory();
    }, [isDemo, loadPrivacyHistory, onDownloadExport, onExportDemoFallback, showToast]);

    const handlePrivacyRequest = React.useCallback(async (requestType: 'access' | 'delete' | 'rectify') => {
        if (isDemo) {
            showToast('Modo demo: solicitação LGPD indisponível', 'error');
            return;
        }

        const result = await createPrivacyRequest(requestType, PRIVACY_REQUEST_LABELS[requestType]);
        if (!result.success) {
            showToast(result.error || 'Erro ao abrir solicitação', 'error');
            return;
        }

        showToast('Solicitação registrada com sucesso.');
        await loadPrivacyHistory();
    }, [isDemo, loadPrivacyHistory, showToast]);

    const handleCancelPrivacyRequest = React.useCallback(async (requestId: string) => {
        const result = await cancelPrivacyRequest(requestId);
        if (!result.success) {
            showToast(result.error || 'Não foi possível cancelar a solicitação', 'error');
            return;
        }

        showToast('Solicitação cancelada.');
        await loadPrivacyHistory();
    }, [loadPrivacyHistory, showToast]);

    const handlePrivacyConsentChange = React.useCallback(async (
        consentType: 'privacy_policy' | 'ai_data_processing' | 'clinical_data_processing',
        granted: boolean
    ) => {
        if (isDemo) {
            showToast('Modo demo: consentimentos LGPD indisponíveis', 'error');
            return;
        }

        setPrivacyConsentSaving(consentType);
        try {
            const result = await upsertPrivacyConsent(consentType, granted, {
                origin: 'settings_privacy_modal'
            });
            if (!result.success) {
                showToast(result.error || 'Erro ao atualizar consentimento', 'error');
                return;
            }

            showToast(granted ? 'Consentimento registrado.' : 'Consentimento revogado.');
            await loadPrivacyHistory();
        } finally {
            setPrivacyConsentSaving(null);
        }
    }, [isDemo, loadPrivacyHistory, showToast]);

    return {
        privacyRequests,
        privacyConsents,
        privacyLoading,
        privacyConsentSaving,
        loadPrivacyHistory,
        handleExportLivePrivacyData,
        handlePrivacyRequest,
        handleCancelPrivacyRequest,
        handlePrivacyConsentChange
    };
}
