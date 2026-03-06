
import React from 'react';
import { getSafeAvatarUrl } from '../utils/validation';
import { supabase } from '../services/supabaseCore';
import PageHeader from '../components/PageHeader';
import { BottomSheet } from '../components/BottomSheet';
import { User, Bell, Palette, Shield, CreditCard, HelpCircle, ChevronRight, Edit3, LogOut, FileText, Download } from 'lucide-react';
import { useTheme, type ThemeMode } from '../services/ThemeContext';
import {
    isPushSupported,
    loadNotificationPrefs,
    saveNotificationPrefs,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
} from '../services/pushNotifications';
import { sendPushTestNotification } from '../services/pushNotificationSender';

interface SettingsViewProps {
    user?: any;
    onBack: () => void;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onBack, onLogout }) => {
    // Extract user info from Supabase Auth
    const coachName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
    const coachEmail = user?.email || 'email@exemplo.com';
    // Use validated avatar URL to prevent untrusted image sources
    const rawAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const coachAvatar = getSafeAvatarUrl(rawAvatarUrl, coachName);
    const isDemo = user?.isDemo || !user?.id;
    // States for Modals
    const [activeModal, setActiveModal] = React.useState<'profile' | 'notifications' | 'security' | 'help' | 'appearance' | 'privacy' | null>(null);

    // Theme state — connected to global ThemeContext
    const { theme: selectedTheme, setTheme: setSelectedTheme } = useTheme();
    const [pendingTheme, setPendingTheme] = React.useState<ThemeMode>(selectedTheme);

    // Sync pendingTheme when appearance modal opens
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

    // States for Profile Editing
    const [profileName, setProfileName] = React.useState(coachName);
    const [saving, setSaving] = React.useState(false);

    // States for Notifications
    const [notifState, setNotifState] = React.useState(() => loadNotificationPrefs());
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [securitySaving, setSecuritySaving] = React.useState(false);
    const [sendingTestPush, setSendingTestPush] = React.useState(false);

    // States for Toast
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

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
            // tabela/back-end pode não estar provisionado ainda
        }
    }, [user?.id]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    };

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
                setNotifState((prev) => {
                    if (prev.push) return prev;
                    const next = { ...prev, push: true };
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

    const toggleNotif = async (key: keyof typeof notifState) => {
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

    const menuItems = [
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
        },
    ];

    // Save profile changes to Supabase Auth
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
        } catch (error: any) {
            console.error('Error updating profile:', error);
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

    const handleExportPrivacyReport = () => {
        if (typeof window === 'undefined') return;

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

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `personalpro-privacy-report-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        showToast('Relatório de privacidade exportado.');
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

    // Generic save handler based on current modal
    const handleSave = () => {
        if (activeModal === 'profile') {
            handleSaveProfile();
        } else if (activeModal === 'notifications') {
            handleSaveNotifications();
        } else if (activeModal === 'security') {
            handleSaveSecurity();
        } else {
            setActiveModal(null);
            showToast('Alterações salvas com sucesso');
        }
    };


    return (
        <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12 relative bg-[var(--bg-void)]">

            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
                    <div
                        className={`px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-xl border ${toastType === 'error'
                            ? 'bg-[rgba(255,51,102,0.15)] border-[rgba(255,51,102,0.25)]'
                            : 'bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.2)]'
                            }`}
                    >
                        <div
                            className={`size-4 rounded-full ${toastType === 'error' ? 'bg-[#FF3366]' : 'bg-[#3B82F6]'}`}
                        />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* AI Header */}
            <PageHeader
                title="Configurações"
                subtitle="Ajustes Elite"
                onBack={onBack}
                accentColor="cyan"
            />

            {/* Profile Card */}
            <div className="px-5 mb-6">
                <div
                    className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4 bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]"
                >
                    {/* Glow orb */}
                    <div className="absolute top-0 right-0 size-32 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-[20px]" />

                    <img
                        className="size-16 rounded-2xl shrink-0 object-cover border-[1.5px] border-[rgba(59,130,246,0.15)]"
                        src={coachAvatar}
                        alt={coachName}
                    />
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-black text-white leading-tight">{coachName}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1 text-[#3D5A80]">
                            {isDemo ? 'Modo Demonstração' : 'Personal Trainer Elite'}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveModal('profile')}
                        className="size-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]"
                    >
                        <Edit3 size={15} className="text-[#3B82F6]" />
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-5 space-y-2">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={item.action}
                        className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left group bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.06)]"
                    >
                        <div
                            className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.chipClassName}`}
                        >
                            <item.icon size={17} className={item.iconClassName} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white text-sm tracking-tight">{item.label}</h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-[#3D5A80]">{item.subtitle}</p>
                        </div>
                        <ChevronRight size={14} className="text-[#3D5A80]" />
                    </button>
                ))}
            </div>

            {/* Logout */}
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

            {/* Universal Modal Overlay */}
            <BottomSheet isOpen={!!activeModal} onClose={() => setActiveModal(null)}>

                {/* ---------- PROFILE MODAL ---------- */}
                {activeModal === 'profile' && (
                    <>
                        <div className="text-center mb-8">
                            <img className="size-24 mx-auto rounded-[30px] object-cover border-4 border-slate-950 shadow-glow mb-4" src={coachAvatar} alt={coachName} />
                            <h3 className="text-2xl font-black text-white">Editar Perfil</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Atualize suas informações</p>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3 focus-within:border-blue-500/50 transition-colors">
                                <span className="material-symbols-outlined text-slate-500">person</span>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome</p>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="bg-transparent text-sm font-black text-white w-full outline-none"
                                    />
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3 focus-within:border-blue-500/50 transition-colors">
                                <span className="material-symbols-outlined text-slate-500">mail</span>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
                                    <input type="email" defaultValue={coachEmail} disabled className="bg-transparent text-sm font-black text-slate-400 w-full outline-none cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Salvar Alterações'
                            )}
                        </button>
                    </>
                )}

                {/* ---------- NOTIFICATIONS MODAL ---------- */}
                {activeModal === 'notifications' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-blue-400">notifications_active</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">Notificações</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Controle seus alertas</p>
                        </div>
                        <div className="space-y-3 mb-8">
                            {[
                                { key: 'push', label: 'Push Notifications', sub: isPushSupported() ? 'Alertas no celular' : 'Indisponível neste navegador', comingSoon: !isPushSupported() },
                                { key: 'email', label: 'Emails', sub: 'Resumos e relatórios' },
                                { key: 'sms', label: 'SMS', sub: 'Avisos urgentes' },
                                { key: 'promo', label: 'Marketing', sub: 'Novidades e ofertas' }
                            ].map((item) => (
                                <div key={item.key} onClick={() => toggleNotif(item.key as keyof typeof notifState)} className={`bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer hover:bg-white/10 ${item.comingSoon ? 'opacity-80' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${item.comingSoon ? 'bg-slate-800 text-slate-500' : notifState[item.key as keyof typeof notifState] ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-sm">{item.comingSoon ? 'schedule' : notifState[item.key as keyof typeof notifState] ? 'check' : 'close'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{item.label}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {item.comingSoon ? `${item.sub} • Em breve` : item.sub}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-7 rounded-full relative transition-colors ${item.comingSoon ? 'bg-slate-700' : notifState[item.key as keyof typeof notifState] ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all ${item.comingSoon ? 'left-1' : notifState[item.key as keyof typeof notifState] ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSendTestPush}
                            disabled={!notifState.push || sendingTestPush || isDemo}
                            className="w-full h-12 mb-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.18)] text-[#93C5FD]"
                        >
                            {sendingTestPush ? 'Enviando push...' : 'Enviar Push de Teste'}
                        </button>
                        <button onClick={handleSave} className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow">
                            Confirmar Preferências
                        </button>
                    </>
                )}

                {/* ---------- SECURITY MODAL ---------- */}
                {activeModal === 'security' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-emerald-400">security</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">Segurança</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Proteja sua conta</p>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Nova Senha</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-400">key</span>
                                    <input
                                        type="password"
                                        placeholder="Mínimo 8 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmar Nova Senha</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">password</span>
                                    <input
                                        type="password"
                                        placeholder="Repita a senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-slate-400">Autenticação em 2 Etapas (2FA)</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Em breve</span>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={securitySaving} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            {securitySaving ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                    </>
                )}

                {/* ---------- HELP MODAL ---------- */}
                {activeModal === 'help' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
                                <span className="material-symbols-outlined text-3xl text-[#3B82F6]">support_agent</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">Central de Ajuda</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Como podemos ajudar?</p>
                        </div>
                        <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                'Como criar um novo treino?',
                                'Como cadastrar um aluno?',
                                'Onde vejo meu faturamento?',
                                'Como funciona a IA?',
                                'Posso cancelar a qualquer momento?'
                            ].map((q, i) => (
                                <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer hover:bg-white/10 group">
                                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">{q}</span>
                                    <span className="material-symbols-outlined text-slate-600 group-hover:text-white">expand_more</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => showToast('Mensagem enviada ao suporte!')} className="w-full h-16 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_24px_rgba(30,58,138,0.35)]">
                            Falar com Suporte Humano
                        </button>
                    </>
                )}

                {/* ---------- APPEARANCE MODAL ---------- */}
                {activeModal === 'appearance' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-pink-400">palette</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">Aparência</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Personalize seu app</p>
                        </div>
                        <div className="space-y-3 mb-8">
                            {[
                                { key: 'dark', label: 'Modo Escuro', icon: 'dark_mode', desc: 'Interface escura premium' },
                                { key: 'light', label: 'Modo Claro', icon: 'light_mode', desc: 'Interface clara e nítida' },
                                { key: 'system', label: 'Automático', icon: 'brightness_auto', desc: 'Segue o sistema' }
                            ].map((themeOption) => (
                                <div
                                    key={themeOption.key}
                                    onClick={() => setPendingTheme(themeOption.key as ThemeMode)}
                                    className={`bg-white/5 rounded-2xl p-4 border flex items-center justify-between transition-all cursor-pointer
                                                ${pendingTheme === themeOption.key
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-white/5 hover:bg-white/10'}
                                            `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${pendingTheme === themeOption.key ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-sm">{themeOption.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{themeOption.label}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {pendingTheme === themeOption.key ? 'Selecionado' : themeOption.desc}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${pendingTheme === themeOption.key ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                                        {pendingTheme === themeOption.key && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedTheme(pendingTheme);
                                showToast(`Tema ${pendingTheme === 'dark' ? 'escuro' : pendingTheme === 'light' ? 'claro' : 'automático'} aplicado!`);
                                setActiveModal(null);
                            }}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-500 font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow text-white"
                        >
                            Aplicar Tema
                        </button>
                    </>
                )}

                {activeModal === 'privacy' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-teal-300">privacy_tip</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">Privacidade e Dados</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">LGPD operacional</p>
                        </div>
                        <div className="space-y-3 mb-8">
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Proteções ativas</p>
                                <p className="mt-2 text-sm font-bold text-white">Prompts de IA mascarados e dados clínicos protegidos no backend.</p>
                                <p className="mt-1 text-xs text-slate-400">Fluxos sensíveis usam redaction, categorização e camada de criptografia clínica.</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Seus direitos</p>
                                <p className="mt-2 text-sm text-slate-300">Acesso, correção, exportação e exclusão dependem de processo operacional e backend do produto.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={handleExportPrivacyReport}
                                className="w-full h-14 rounded-2xl border border-[rgba(45,212,191,0.2)] bg-[rgba(20,184,166,0.08)] text-sm font-black uppercase tracking-widest text-teal-200"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Download size={15} />
                                    Exportar Relatório
                                </span>
                            </button>
                            <a
                                href="/privacy-policy.html"
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-14 items-center justify-center rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.08)] text-sm font-black uppercase tracking-widest text-blue-200"
                            >
                                Abrir Política de Privacidade
                            </a>
                        </div>
                    </>
                )}

            </BottomSheet>
        </div>
    );
};

export default SettingsView;
