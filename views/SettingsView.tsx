
import React from 'react';
import { getSafeAvatarUrl } from '../utils/validation';
import { supabase } from '../services/supabaseClient';

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
    const [activeModal, setActiveModal] = React.useState<'profile' | 'notifications' | 'security' | 'help' | null>(null);

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
        { icon: 'person', label: 'Meus Dados', subtitle: 'Nome, email, foto', action: () => setActiveModal('profile') },
        { icon: 'notifications', label: 'Notificações', subtitle: 'Push e email', action: () => setActiveModal('notifications') },
        { icon: 'palette', label: 'Aparência', subtitle: 'Tema e cores', action: () => showToast('Tema Escuro Definido por Padrão') },
        { icon: 'security', label: 'Segurança', subtitle: 'Senha e 2FA', action: () => setActiveModal('security') },
        { icon: 'credit_card', label: 'Assinatura', subtitle: 'Plano Premium', action: () => showToast('Você possui o plano Apex Elite') },
        { icon: 'help', label: 'Ajuda', subtitle: 'FAQ e suporte', action: () => setActiveModal('help') },
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
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12 relative">
            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
                    <div className={`glass-card ${toastType === 'error' ? 'bg-red-900/90 border-red-500/20' : 'bg-slate-900/90'} px-6 py-3 rounded-full shadow-glow border border-white/10 flex items-center gap-3`}>
                        <span className={`material-symbols-outlined ${toastType === 'error' ? 'text-red-400' : 'text-blue-400'} text-sm`}>{toastType === 'error' ? 'error' : 'check_circle'}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 pt-14 pb-8 flex items-center gap-4 animate-fade-in">
                <button
                    onClick={onBack}
                    className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all group"
                >
                    <span className="material-symbols-outlined text-white group-hover:text-blue-400 transition-colors">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Configurações</h1>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ajustes Elite</p>
                </div>
            </header>

            {/* Profile Card */}
            <div className="px-6 mb-8 animate-slide-up">
                <div className="glass-card rounded-[32px] p-6 flex items-center gap-4 shadow-glow group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div
                        className="size-16 rounded-[20px] bg-cover bg-center border-2 border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${coachAvatar})` }}
                    />
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-black text-white leading-tight">{coachName}</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                            {isDemo ? 'Modo Demonstração' : 'Personal Trainer Elite'}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveModal('profile')}
                        className="size-12 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-blue-600 hover:text-white group-hover:shadow-glow"
                    >
                        <span className="material-symbols-outlined text-blue-400 group-hover:text-white transition-colors">edit</span>
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-6 space-y-3 animate-slide-up stagger-1">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={item.action}
                        className="w-full glass-card rounded-[28px] p-5 flex items-center gap-5 active:scale-[0.98] transition-all duration-300 text-left hover:border-blue-500/30 group"
                    >
                        <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                            <span className="material-symbols-outlined text-blue-400 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white text-sm tracking-tight group-hover:translate-x-1 transition-transform">{item.label}</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{item.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">chevron_right</span>
                    </button>
                ))}
            </div>

            {/* Sair */}
            <div className="px-6 mt-12 animate-slide-up stagger-2">
                <button
                    onClick={onLogout}
                    className="w-full h-16 bg-red-500/5 border border-red-500/10 text-red-500 font-black rounded-[28px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Finalizar Sessão
                </button>
            </div>

            {/* Version */}
            <p className="text-center text-[9px] font-black text-slate-700 mt-12 uppercase tracking-[0.3em]">Apex Elite Framework • v1.1.0</p>

            {/* Universal Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-8 animate-slide-up shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>

                        {/* Close Button defined by logic or just clicking outside/saving */}
                        <button
                            onClick={() => setActiveModal(null)}
                            className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

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
                                    <div className="size-16 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-3xl text-purple-400">support_agent</span>
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
                                            <span className="material-symbols-outlined text-slate-600 group-hover:text-purple-400">expand_more</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => showToast('Mensagem enviada ao suporte!')} className="w-full h-16 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                                    Falar com Suporte Humano
                                </button>
                            </>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
