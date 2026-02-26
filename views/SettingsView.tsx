
import React from 'react';
import { getSafeAvatarUrl } from '../utils/validation';
import { supabase } from '../services/supabaseClient';
import PageHeader from '../components/PageHeader';
import { BottomSheet } from '../components/BottomSheet';
import { User, Bell, Palette, Shield, CreditCard, HelpCircle, ChevronRight, Edit3, LogOut } from 'lucide-react';

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
    const [activeModal, setActiveModal] = React.useState<'profile' | 'notifications' | 'security' | 'help' | 'appearance' | null>(null);

    // Theme state
    const [selectedTheme, setSelectedTheme] = React.useState<'dark' | 'light' | 'system'>('dark');

    // States for Profile Editing
    const [profileName, setProfileName] = React.useState(coachName);
    const [saving, setSaving] = React.useState(false);

    // States for Notifications
    const [notifState, setNotifState] = React.useState({
        push: true,
        email: false,
        sms: true,
        promo: false
    });

    // States for Toast
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const toggleNotif = (key: keyof typeof notifState) => {
        setNotifState(prev => ({ ...prev, [key]: !prev[key] }));
        // Haptic feedback simulation via toast or just verify visually
    };

    const menuItems = [
        { icon: User, label: 'Meus Dados', subtitle: 'Nome, email, foto', action: () => setActiveModal('profile'), color: '#3B82F6' },
        { icon: Bell, label: 'Notificações', subtitle: 'Push e email', action: () => setActiveModal('notifications'), color: '#0099FF' },
        { icon: Palette, label: 'Aparência', subtitle: 'Tema e cores', action: () => setActiveModal('appearance'), color: '#00FF88' },
        { icon: Shield, label: 'Segurança', subtitle: 'Senha e 2FA', action: () => setActiveModal('security'), color: '#FFB800' },
        { icon: CreditCard, label: 'Assinatura', subtitle: 'Plano Premium', action: () => showToast('Você possui o plano Apex Elite'), color: '#3B82F6' },
        { icon: HelpCircle, label: 'Ajuda', subtitle: 'FAQ e suporte', action: () => setActiveModal('help'), color: '#7A9FCC' },
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

    // Save notification preferences (stored in localStorage for now)
    const handleSaveNotifications = () => {
        localStorage.setItem('apex_notifications', JSON.stringify(notifState));
        showToast('Preferências de notificação salvas!');
        setActiveModal(null);
    };

    // Generic save handler based on current modal
    const handleSave = () => {
        if (activeModal === 'profile') {
            handleSaveProfile();
        } else if (activeModal === 'notifications') {
            handleSaveNotifications();
        } else {
            setActiveModal(null);
            showToast('Alterações salvas com sucesso');
        }
    };


    return (
        <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 pb-12 relative" style={{ background: 'var(--bg-void)' }}>

            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
                    <div
                        className="px-6 py-3 rounded-full flex items-center gap-3"
                        style={{
                            background: toastType === 'error' ? 'rgba(255,51,102,0.15)' : 'rgba(59, 130, 246,0.1)',
                            border: `1px solid ${toastType === 'error' ? 'rgba(255,51,102,0.25)' : 'rgba(59, 130, 246,0.2)'}`,
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div
                            className="size-4 rounded-full"
                            style={{ background: toastType === 'error' ? '#FF3366' : '#3B82F6' }}
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
                    className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4"
                    style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}
                >
                    {/* Glow orb */}
                    <div className="absolute top-0 right-0 size-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246,0.08) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                    <div
                        className="size-16 rounded-2xl bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${coachAvatar})`, border: '1.5px solid rgba(59, 130, 246,0.15)' }}
                    />
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-black text-white leading-tight">{coachName}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#3D5A80' }}>
                            {isDemo ? 'Modo Demonstração' : 'Personal Trainer Elite'}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveModal('profile')}
                        className="size-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0"
                        style={{ background: 'rgba(59, 130, 246,0.08)', border: '1px solid rgba(59, 130, 246,0.15)' }}
                    >
                        <Edit3 size={15} style={{ color: '#3B82F6' }} />
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-5 space-y-2">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={item.action}
                        className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left group"
                        style={{ background: 'rgba(59, 130, 246,0.03)', border: '1px solid rgba(59, 130, 246,0.06)' }}
                    >
                        <div
                            className="size-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}
                        >
                            <item.icon size={17} style={{ color: item.color }} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white text-sm tracking-tight">{item.label}</h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#3D5A80' }}>{item.subtitle}</p>
                        </div>
                        <ChevronRight size={14} style={{ color: '#3D5A80' }} />
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="px-5 mt-8">
                <button
                    onClick={onLogout}
                    className="w-full h-14 font-black rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                    style={{
                        background: 'rgba(255,51,102,0.06)',
                        border: '1px solid rgba(255,51,102,0.15)',
                        color: '#FF3366',
                    }}
                >
                    <LogOut size={16} />
                    Finalizar Sessão
                </button>
            </div>

            <p className="text-center text-[9px] font-black mt-10 uppercase tracking-[0.3em]" style={{ color: '#1E3A5F' }}>Apex Elite Framework • v1.1.0</p>

            {/* Universal Modal Overlay */}
            <BottomSheet isOpen={!!activeModal} onClose={() => setActiveModal(null)}>

                {/* ---------- PROFILE MODAL ---------- */}
                {activeModal === 'profile' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-24 mx-auto rounded-[30px] bg-cover bg-center border-4 border-slate-950 shadow-glow mb-4" style={{ backgroundImage: `url(${coachAvatar})` }}></div>
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
                                { key: 'push', label: 'Push Notifications', sub: 'Alertas no celular' },
                                { key: 'email', label: 'Emails', sub: 'Resumos e relatórios' },
                                { key: 'sms', label: 'SMS', sub: 'Avisos urgentes' },
                                { key: 'promo', label: 'Marketing', sub: 'Novidades e ofertas' }
                            ].map((item) => (
                                <div key={item.key} onClick={() => toggleNotif(item.key as any)} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer hover:bg-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${notifState[item.key as keyof typeof notifState] ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-sm">{notifState[item.key as keyof typeof notifState] ? 'check' : 'close'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{item.label}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.sub}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-7 rounded-full relative transition-colors ${notifState[item.key as keyof typeof notifState] ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all ${notifState[item.key as keyof typeof notifState] ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Senha Atual</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-500">lock</span>
                                    <input type="password" placeholder="••••••••" className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600" />
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Nova Senha</p>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-400">key</span>
                                    <input type="password" placeholder="Digite a nova senha" className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2">
                                <span className="text-xs font-bold text-slate-400">Autenticação em 2 Etapas (2FA)</span>
                                <div className="w-10 h-6 bg-slate-700 rounded-full relative opacity-50"><div className="absolute top-1 left-1 size-4 bg-white rounded-full"></div></div>
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            Atualizar Segurança
                        </button>
                    </>
                )}

                {/* ---------- HELP MODAL ---------- */}
                {activeModal === 'help' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="size-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59, 130, 246,0.08)', border: '1px solid rgba(59, 130, 246,0.15)' }}>
                                <span className="material-symbols-outlined text-3xl" style={{ color: '#3B82F6' }}>support_agent</span>
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
                                    <span className="material-symbols-outlined text-slate-600" style={{ color: 'inherit' }}>expand_more</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => showToast('Mensagem enviada ao suporte!')} className="w-full h-16 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', boxShadow: '0 0 24px rgba(30, 58, 138,0.35)' }}>
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
                                { key: 'dark', label: 'Modo Escuro', icon: 'dark_mode', enabled: true },
                                { key: 'light', label: 'Modo Claro', icon: 'light_mode', enabled: false },
                                { key: 'system', label: 'Automático', icon: 'brightness_auto', enabled: false }
                            ].map((theme) => (
                                <div
                                    key={theme.key}
                                    onClick={() => theme.enabled && setSelectedTheme(theme.key as any)}
                                    className={`bg-white/5 rounded-2xl p-4 border flex items-center justify-between transition-all cursor-pointer
                                                ${selectedTheme === theme.key
                                            ? 'border-blue-500/50 bg-blue-500/10'
                                            : 'border-white/5 hover:bg-white/10'}
                                                ${!theme.enabled && 'opacity-50 cursor-not-allowed'}
                                            `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${selectedTheme === theme.key ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-sm">{theme.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{theme.label}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {theme.enabled ? (selectedTheme === theme.key ? 'Selecionado' : 'Disponível') : 'Em breve'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedTheme === theme.key ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                                        {selectedTheme === theme.key && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                showToast('Tema aplicado com sucesso!');
                                setActiveModal(null);
                            }}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow"
                        >
                            Aplicar Tema
                        </button>
                    </>
                )}

            </BottomSheet>
        </div>
    );
};

export default SettingsView;
