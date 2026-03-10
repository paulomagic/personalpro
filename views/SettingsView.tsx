import React from 'react';
import { User, Bell, Palette, Shield, CreditCard, HelpCircle, LogOut, FileText } from 'lucide-react';
import { getSafeAvatarUrl } from '../utils/validation';
import { supabase } from '../services/supabaseCore';
import PageHeader from '../components/PageHeader';
import { BottomSheet } from '../components/BottomSheet';
import SettingsToast from '../components/settings/SettingsToast';
import SettingsProfileCard from '../components/settings/SettingsProfileCard';
import SettingsMenuList, { type SettingsMenuItem } from '../components/settings/SettingsMenuList';
import SettingsModalContent, { type SettingsModalType } from '../components/settings/SettingsModalContent';
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
    downloadPrivacyJson,
} from '../services/privacyService';
import { useSettingsPrivacy } from '../hooks/useSettingsPrivacy';
import { getBrowserSummary } from '../utils/browserInfo';

interface SettingsViewProps {
    user?: any;
    onBack: () => void;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onBack, onLogout }) => {
    const coachName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
    const coachEmail = user?.email || 'email@exemplo.com';
    const rawAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const coachAvatar = getSafeAvatarUrl(rawAvatarUrl, coachName);
    const isDemo = user?.isDemo || !user?.id;
    const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();

    const [activeModal, setActiveModal] = React.useState<SettingsModalType>(null);
    const { theme: selectedTheme, setTheme: setSelectedTheme } = useTheme();
    const [pendingTheme, setPendingTheme] = React.useState<ThemeMode>(selectedTheme);

    const [profileName, setProfileName] = React.useState(coachName);
    const [saving, setSaving] = React.useState(false);

    const [notifState, setNotifState] = React.useState<NotificationPrefs>(() => loadNotificationPrefs());
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [securitySaving, setSecuritySaving] = React.useState(false);
    const [sendingTestPush, setSendingTestPush] = React.useState(false);

    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

    const activeModalTitle = React.useMemo(() => {
        if (activeModal === 'profile') return 'Editar Perfil';
        if (activeModal === 'notifications') return 'Notificações';
        if (activeModal === 'appearance') return 'Aparência';
        if (activeModal === 'security') return 'Segurança';
        if (activeModal === 'help') return 'Ajuda';
        if (activeModal === 'privacy') return 'Privacidade e Dados';
        return undefined;
    }, [activeModal]);

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

    const supportCtaLabel = supportEmail ? 'Abrir Contato com Suporte' : 'Copiar Informações para Suporte';

    const handleExportPrivacyReport = React.useCallback(() => {
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

        const result = downloadPrivacyJson(report, 'personal-pro-privacy-report');
        showToast(result.success ? 'Relatório de privacidade exportado.' : (result.error || 'Erro ao exportar relatório'), result.success ? 'success' : 'error');
    }, [coachEmail, isDemo, notifState, profileName, selectedTheme, showToast]);

    const handleDownloadLivePrivacyExport = React.useCallback((data: unknown) => {
        const downloadResult = downloadPrivacyJson(data, 'personal-pro-lgpd-export');
        showToast(downloadResult.success ? 'Exportação LGPD concluída.' : (downloadResult.error || 'Erro ao finalizar exportação'), downloadResult.success ? 'success' : 'error');
    }, [showToast]);

    const handleContactSupport = React.useCallback(async () => {
        const diagnostics = [
            `App: Personal Pro`,
            `Data: ${new Date().toISOString()}`,
            `Usuário: ${coachEmail}`,
            `Modo demo: ${isDemo ? 'sim' : 'não'}`,
            `Tema: ${selectedTheme}`,
            `Push ativo: ${notifState.push ? 'sim' : 'não'}`,
            `Navegador: ${getBrowserSummary()}`
        ].join('\n');

        const copyDiagnostics = async () => {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(diagnostics);
                    return true;
                } catch {
                    // fallback below
                }
            }

            if (typeof document !== 'undefined') {
                const textarea = document.createElement('textarea');
                textarea.value = diagnostics;
                textarea.setAttribute('readonly', 'true');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.pointerEvents = 'none';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                const copied = document.execCommand('copy');
                document.body.removeChild(textarea);
                return copied;
            }

            return false;
        };

        if (supportEmail) {
            const subject = encodeURIComponent('Personal Pro - Solicitação de suporte');
            const body = encodeURIComponent(`Descreva o problema abaixo:\n\n---\n${diagnostics}\n---\n`);
            window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
            showToast('Canal de suporte aberto.');
            return;
        }

        try {
            const copied = await copyDiagnostics();
            showToast(copied ? 'Informações copiadas para enviar ao suporte.' : 'Não foi possível copiar as informações.', copied ? 'success' : 'error');
        } catch {
            showToast('Não foi possível copiar as informações.', 'error');
        }
    }, [coachEmail, isDemo, notifState.push, selectedTheme, showToast, supportEmail]);

    const {
        privacyRequests,
        privacyConsents,
        privacyLoading,
        privacyConsentSaving,
        privacyDeleteReadiness,
        loadPrivacyHistory,
        handleExportLivePrivacyData,
        handlePrivacyRequest,
        handleCancelPrivacyRequest,
        handlePrivacyConsentChange
    } = useSettingsPrivacy({
        isDemo,
        showToast,
        onExportDemoFallback: handleExportPrivacyReport,
        onDownloadExport: handleDownloadLivePrivacyExport
    });

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
                    user_agent: getBrowserSummary(),
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
            action: () => showToast('Seu plano atual já está ativo'),
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
                subtitle="Preferências do app"
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

            <p className="text-center text-[9px] font-black mt-10 uppercase tracking-[0.3em] text-[#7A9FCC]">Personal Pro • v1.1.0</p>

            <BottomSheet isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={activeModalTitle}>
                <SettingsModalContent
                    activeModal={activeModal}
                    coachAvatar={coachAvatar}
                    coachName={coachName}
                    profileName={profileName}
                    coachEmail={coachEmail}
                    saving={saving}
                    notifState={notifState}
                    sendingTestPush={sendingTestPush}
                    isDemo={isDemo}
                    newPassword={newPassword}
                    confirmPassword={confirmPassword}
                    securitySaving={securitySaving}
                    pendingTheme={pendingTheme}
                    privacyRequests={privacyRequests}
                    privacyConsents={privacyConsents}
                    privacyLoading={privacyLoading}
                    privacyConsentSaving={privacyConsentSaving}
                    privacyDeleteReadiness={privacyDeleteReadiness}
                    supportCtaLabel={supportCtaLabel}
                    onProfileNameChange={setProfileName}
                    onSaveProfile={handleSaveProfile}
                    onToggleNotif={toggleNotif}
                    onSendTestPush={handleSendTestPush}
                    onSaveNotifications={handleSaveNotifications}
                    onNewPasswordChange={setNewPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onSaveSecurity={handleSaveSecurity}
                    onContactSupport={handleContactSupport}
                    onThemeChange={setPendingTheme}
                    onApplyTheme={applyTheme}
                    onExportPrivacy={handleExportLivePrivacyData}
                    onRequestDelete={(notes) => handlePrivacyRequest('delete', notes)}
                    onRequestAccess={() => handlePrivacyRequest('access')}
                    onRequestRectify={() => handlePrivacyRequest('rectify')}
                    onCancelRequest={handleCancelPrivacyRequest}
                    onConsentChange={(consentType, granted) => void handlePrivacyConsentChange(consentType, granted)}
                />
            </BottomSheet>
        </div>
    );
};

export default SettingsView;
