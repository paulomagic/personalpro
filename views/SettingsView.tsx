import React from 'react';
import { User, Bell, Palette, Shield, CreditCard, HelpCircle, LogOut, FileText } from 'lucide-react';
import { getSafeAvatarUrl } from '../utils/validation';
import { supabase } from '../services/supabaseCore';
import PageHeader from '../components/PageHeader';
import { BottomSheet } from '../components/BottomSheet';
import SettingsToast from '../components/settings/SettingsToast';
import SettingsProfileCard from '../components/settings/SettingsProfileCard';
import SettingsMenuList, { type SettingsMenuItem } from '../components/settings/SettingsMenuList';
import SettingsProfileModal from '../components/settings/SettingsProfileModal';
import SettingsNotificationsModal from '../components/settings/SettingsNotificationsModal';
import SettingsSecurityModal from '../components/settings/SettingsSecurityModal';
import SettingsHelpModal from '../components/settings/SettingsHelpModal';
import SettingsAppearanceModal from '../components/settings/SettingsAppearanceModal';
import SettingsPrivacyModal from '../components/settings/SettingsPrivacyModal';
import { useTheme, type ThemeMode } from '../services/ThemeContext';
import {
    isPushSupported,
    loadNotificationPrefs,
    saveNotificationPrefs,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    type NotificationPrefs
} from '../services/pushNotifications';
import { sendPushTestNotification } from '../services/pushNotificationSender';
import {
    cancelPrivacyRequest,
    createPrivacyRequest,
    downloadPrivacyJson,
    exportMyPrivacyData,
    listPrivacyRequests,
    type PrivacyRequestSummary
} from '../services/privacyService';

interface SettingsViewProps {
    user?: any;
    onBack: () => void;
    onLogout: () => void;
}

type SettingsModal = 'profile' | 'notifications' | 'security' | 'help' | 'appearance' | 'privacy' | null;

const PRIVACY_REQUEST_LABELS = {
    access: 'Solicitação de acesso gerada via autoatendimento.',
    delete: 'Solicitação de exclusão de conta aberta pelo titular.',
    rectify: 'Solicitação de retificação cadastral aberta pelo titular.'
} as const;

const SettingsView: React.FC<SettingsViewProps> = ({ user, onBack, onLogout }) => {
    const coachName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
    const coachEmail = user?.email || 'email@exemplo.com';
    const rawAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const coachAvatar = getSafeAvatarUrl(rawAvatarUrl, coachName);
    const isDemo = user?.isDemo || !user?.id;

    const [activeModal, setActiveModal] = React.useState<SettingsModal>(null);
    const { theme: selectedTheme, setTheme: setSelectedTheme } = useTheme();
    const [pendingTheme, setPendingTheme] = React.useState<ThemeMode>(selectedTheme);

    const [profileName, setProfileName] = React.useState(coachName);
    const [saving, setSaving] = React.useState(false);

    const [notifState, setNotifState] = React.useState<NotificationPrefs>(() => loadNotificationPrefs());
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [securitySaving, setSecuritySaving] = React.useState(false);
    const [sendingTestPush, setSendingTestPush] = React.useState(false);

    const [privacyRequests, setPrivacyRequests] = React.useState<PrivacyRequestSummary[]>([]);
    const [privacyLoading, setPrivacyLoading] = React.useState(false);

    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

    React.useEffect(() => {
        setProfileName(coachName);
    }, [coachName]);

    React.useEffect(() => {
        if (activeModal === 'appearance') {
            setPendingTheme(selectedTheme);
        }
    }, [activeModal, selectedTheme]);

    React.useEffect(() => {
        if (activeModal === 'security') return;
        setNewPassword('');
        setConfirmPassword('');
        setSecuritySaving(false);
    }, [activeModal]);

    const showToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        window.setTimeout(() => setToastMessage(null), 3000);
    }, []);

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

    React.useEffect(() => {
        if (activeModal === 'privacy') {
            void loadPrivacyHistory();
        }
    }, [activeModal, loadPrivacyHistory]);

    const syncPushSubscription = React.useCallback(async (subscription: PushSubscription | null) => {
        if (!supabase || !user?.id) return;

        try {
            if (!subscription) {
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('user_id', user.id);
                return;
            }

            await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.toJSON()?.keys?.p256dh || null,
                    auth: subscription.toJSON()?.keys?.auth || null,
                    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,endpoint'
                });
        } catch {
            // backend de push pode não existir em todos os ambientes
        }
    }, [user?.id]);

    React.useEffect(() => {
        setNotifState(loadNotificationPrefs());
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        if (!isPushSupported()) return;

        navigator.serviceWorker.ready
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => {
                if (cancelled || !subscription) return;
                setNotifState((previous) => {
                    if (previous.push) return previous;
                    const next = { ...previous, push: true };
                    saveNotificationPrefs(next);
                    return next;
                });
            })
            .catch(() => {
                // noop
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const toggleNotif = async (key: keyof NotificationPrefs) => {
        if (key === 'push') {
            if (!isPushSupported()) {
                showToast('Push não suportado neste navegador.', 'error');
                return;
            }

            if (notifState.push) {
                const result = await unsubscribeFromPushNotifications();
                if (!result.success) {
                    showToast(result.message, 'error');
                    return;
                }

                await syncPushSubscription(null);
                const next = { ...notifState, push: false };
                setNotifState(next);
                saveNotificationPrefs(next);
                showToast(result.message);
                return;
            }

            const result = await subscribeToPushNotifications();
            if (!result.success) {
                showToast(result.message, 'error');
                return;
            }

            await syncPushSubscription(result.subscription || null);
            const next = { ...notifState, push: true };
            setNotifState(next);
            saveNotificationPrefs(next);
            showToast(result.message);
            return;
        }

        const next = { ...notifState, [key]: !notifState[key] };
        setNotifState(next);
        saveNotificationPrefs(next);
    };

    const handleSaveProfile = async () => {
        if (isDemo) {
            showToast('Modo demo: alterações não são salvas', 'error');
            setActiveModal(null);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase!.auth.updateUser({
                data: { full_name: profileName }
            });

            if (error) throw error;

            showToast('Perfil atualizado com sucesso!');
            setActiveModal(null);
        } catch {
            showToast('Erro ao atualizar perfil', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = () => {
        saveNotificationPrefs(notifState);
        showToast('Preferências de notificação salvas.');
        setActiveModal(null);
    };

    const handleSendTestPush = async () => {
        if (isDemo) {
            showToast('Modo demo: push de teste indisponível', 'error');
            return;
        }

        setSendingTestPush(true);
        try {
            const result = await sendPushTestNotification({
                body: 'Se você recebeu esta mensagem, o Web Push está configurado corretamente.',
                url: '/settings'
            });
            showToast(result.message, result.success ? 'success' : 'error');
        } finally {
            setSendingTestPush(false);
        }
    };

    const handleSaveSecurity = async () => {
        if (isDemo) {
            showToast('Modo demo: alteração de senha indisponível', 'error');
            return;
        }

        if (!newPassword || !confirmPassword) {
            showToast('Preencha e confirme a nova senha', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('A senha deve ter pelo menos 8 caracteres', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }

        if (!supabase) {
            showToast('Supabase indisponível para alterar senha', 'error');
            return;
        }

        setSecuritySaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            showToast('Senha atualizada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
            setActiveModal(null);
        } catch (error: any) {
            const message = typeof error?.message === 'string' ? error.message : 'Erro ao atualizar senha';
            showToast(message, 'error');
        } finally {
            setSecuritySaving(false);
        }
    };

    const handleExportPrivacyReport = () => {
        const report = {
            exportedAt: new Date().toISOString(),
            account: {
                name: profileName,
                email: coachEmail,
                isDemo
            },
            preferences: {
                notifications: notifState,
                theme: selectedTheme
            },
            privacyControls: {
                aiPromptProtection: true,
                clinicalDataEncryption: 'enabled_in_backend_rollout',
                offlineQueueStorage: true
            }
        };

        const result = downloadPrivacyJson(report, 'personalpro-privacy-report');
        showToast(result.success ? 'Relatório de privacidade exportado.' : (result.error || 'Erro ao exportar relatório'), result.success ? 'success' : 'error');
    };

    const handleExportLivePrivacyData = async () => {
        if (isDemo) {
            handleExportPrivacyReport();
            return;
        }

        const result = await exportMyPrivacyData();
        if (!result.success) {
            showToast(result.error || 'Erro ao exportar dados', 'error');
            return;
        }

        const downloadResult = downloadPrivacyJson(result.data, 'personalpro-lgpd-export');
        showToast(downloadResult.success ? 'Exportação LGPD concluída.' : (downloadResult.error || 'Erro ao finalizar exportação'), downloadResult.success ? 'success' : 'error');
        await loadPrivacyHistory();
    };

    const handlePrivacyRequest = async (requestType: 'access' | 'delete' | 'rectify') => {
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
    };

    const handleCancelPrivacyRequest = async (requestId: string) => {
        const result = await cancelPrivacyRequest(requestId);
        if (!result.success) {
            showToast(result.error || 'Não foi possível cancelar a solicitação', 'error');
            return;
        }

        showToast('Solicitação cancelada.');
        await loadPrivacyHistory();
    };

    const applyTheme = () => {
        setSelectedTheme(pendingTheme);
        showToast(`Tema ${pendingTheme === 'dark' ? 'escuro' : pendingTheme === 'light' ? 'claro' : 'automático'} aplicado!`);
        setActiveModal(null);
    };

    const menuItems: SettingsMenuItem[] = [
        {
            icon: User,
            label: 'Meus Dados',
            subtitle: 'Nome, email, foto',
            action: () => setActiveModal('profile'),
            chipClassName: 'bg-[#3B82F61F] border border-[#3B82F633]',
            iconClassName: 'text-[#3B82F6]'
        },
        {
            icon: Bell,
            label: 'Notificações',
            subtitle: 'Push e email',
            action: () => setActiveModal('notifications'),
            chipClassName: 'bg-[#0099FF1F] border border-[#0099FF33]',
            iconClassName: 'text-[#0099FF]'
        },
        {
            icon: Palette,
            label: 'Aparência',
            subtitle: 'Tema e cores',
            action: () => setActiveModal('appearance'),
            chipClassName: 'bg-[#00FF881F] border border-[#00FF8833]',
            iconClassName: 'text-[#00FF88]'
        },
        {
            icon: Shield,
            label: 'Segurança',
            subtitle: 'Senha e 2FA',
            action: () => setActiveModal('security'),
            chipClassName: 'bg-[#FFB8001F] border border-[#FFB80033]',
            iconClassName: 'text-[#FFB800]'
        },
        {
            icon: CreditCard,
            label: 'Assinatura',
            subtitle: 'Plano Premium',
            action: () => showToast('Você possui o plano Apex Elite'),
            chipClassName: 'bg-[#3B82F61F] border border-[#3B82F633]',
            iconClassName: 'text-[#3B82F6]'
        },
        {
            icon: HelpCircle,
            label: 'Ajuda',
            subtitle: 'FAQ e suporte',
            action: () => setActiveModal('help'),
            chipClassName: 'bg-[#7A9FCC1F] border border-[#7A9FCC33]',
            iconClassName: 'text-[#7A9FCC]'
        },
        {
            icon: FileText,
            label: 'Privacidade e Dados',
            subtitle: 'LGPD, exportação e política',
            action: () => setActiveModal('privacy'),
            chipClassName: 'bg-[#14B8A61F] border border-[#14B8A633]',
            iconClassName: 'text-[#2DD4BF]'
        }
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12 relative bg-[var(--bg-void)]">
            <SettingsToast message={toastMessage} type={toastType} />

            <PageHeader
                title="Configurações"
                subtitle="Ajustes Elite"
                onBack={onBack}
                accentColor="cyan"
            />

            <SettingsProfileCard
                coachAvatar={coachAvatar}
                coachName={coachName}
                isDemo={isDemo}
                onEdit={() => setActiveModal('profile')}
            />

            <SettingsMenuList items={menuItems} />

            <div className="px-5 mt-8">
                <button
                    onClick={onLogout}
                    className="w-full h-14 font-black rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs bg-[rgba(255,51,102,0.06)] border border-[rgba(255,51,102,0.15)] text-[#FF3366]"
                >
                    <LogOut size={16} />
                    Finalizar Sessão
                </button>
            </div>

            <p className="text-center text-[9px] font-black mt-10 uppercase tracking-[0.3em] text-[#1E3A5F]">Apex Elite Framework • v1.1.0</p>

            <BottomSheet isOpen={!!activeModal} onClose={() => setActiveModal(null)}>
                {activeModal === 'profile' && (
                    <SettingsProfileModal
                        coachAvatar={coachAvatar}
                        coachName={coachName}
                        profileName={profileName}
                        coachEmail={coachEmail}
                        saving={saving}
                        onProfileNameChange={setProfileName}
                        onSave={handleSaveProfile}
                    />
                )}

                {activeModal === 'notifications' && (
                    <SettingsNotificationsModal
                        isPushAvailable={isPushSupported()}
                        notifState={notifState}
                        sendingTestPush={sendingTestPush}
                        isDemo={isDemo}
                        onToggle={toggleNotif}
                        onSendTestPush={handleSendTestPush}
                        onSave={handleSaveNotifications}
                    />
                )}

                {activeModal === 'security' && (
                    <SettingsSecurityModal
                        newPassword={newPassword}
                        confirmPassword={confirmPassword}
                        securitySaving={securitySaving}
                        onNewPasswordChange={setNewPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSave={handleSaveSecurity}
                    />
                )}

                {activeModal === 'help' && (
                    <SettingsHelpModal onContactSupport={() => showToast('Mensagem enviada ao suporte!')} />
                )}

                {activeModal === 'appearance' && (
                    <SettingsAppearanceModal
                        pendingTheme={pendingTheme}
                        onThemeChange={setPendingTheme}
                        onApply={applyTheme}
                    />
                )}

                {activeModal === 'privacy' && (
                    <SettingsPrivacyModal
                        onExport={handleExportLivePrivacyData}
                        onRequestDelete={() => handlePrivacyRequest('delete')}
                        onRequestAccess={() => handlePrivacyRequest('access')}
                        onRequestRectify={() => handlePrivacyRequest('rectify')}
                        onCancelRequest={handleCancelPrivacyRequest}
                        requests={privacyRequests}
                        loadingRequests={privacyLoading}
                    />
                )}
            </BottomSheet>
        </div>
    );
};

export default SettingsView;
