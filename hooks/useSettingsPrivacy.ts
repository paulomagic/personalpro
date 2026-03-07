import React from 'react';
import {
    cancelPrivacyRequest,
    createPrivacyRequest,
    exportMyPrivacyData,
    listPrivacyRequests,
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
    const [privacyLoading, setPrivacyLoading] = React.useState(false);

    const loadPrivacyHistory = React.useCallback(async () => {
        if (isDemo) {
            setPrivacyRequests([]);
            return;
        }

        setPrivacyLoading(true);
        try {
            const result = await listPrivacyRequests();
            if (!result.success) {
                showToast(result.error || 'Erro ao carregar histórico LGPD', 'error');
                return;
            }
            setPrivacyRequests(result.data || []);
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

    return {
        privacyRequests,
        privacyLoading,
        loadPrivacyHistory,
        handleExportLivePrivacyData,
        handlePrivacyRequest,
        handleCancelPrivacyRequest
    };
}
