
import React from 'react';

interface SettingsViewProps {
    onBack: () => void;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
    const [showEditProfile, setShowEditProfile] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const menuItems = [
        { icon: 'person', label: 'Meus Dados', subtitle: 'Nome, email, foto', action: () => setShowEditProfile(true) },
        { icon: 'notifications', label: 'Notificações', subtitle: 'Push e email', action: () => showToast('Configurações de notificação em breve') },
        { icon: 'palette', label: 'Aparência', subtitle: 'Tema e cores', action: () => showToast('Gerenciador de temas em breve') },
        { icon: 'security', label: 'Segurança', subtitle: 'Senha e 2FA', action: () => showToast('Painel de segurança em breve') },
        { icon: 'credit_card', label: 'Assinatura', subtitle: 'Plano Premium', action: () => showToast('Gestão de assinatura em breve') },
        { icon: 'help', label: 'Ajuda', subtitle: 'FAQ e suporte', action: () => showToast('Central de ajuda em breve') },
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12 relative">
            {/* Toast Feedback */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
                    <div className="glass-card bg-slate-900/90 px-6 py-3 rounded-full shadow-glow border border-white/10 flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-sm">info</span>
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
                        style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
                    />
                    <div className="flex-1 relative z-10">
                        <h2 className="text-lg font-black text-white leading-tight">Rodrigo Campanato</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Personal Trainer Elite</p>
                    </div>
                    <button
                        onClick={() => setShowEditProfile(true)}
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

            {/* Edit Profile Modal */}
            {showEditProfile && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-8 animate-slide-up shadow-2xl relative">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>

                        <div className="text-center mb-8">
                            <div className="size-24 mx-auto rounded-[30px] bg-cover bg-center border-4 border-slate-950 shadow-glow mb-4" style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}></div>
                            <h3 className="text-2xl font-black text-white">Editar Perfil</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Atualize suas informações</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500">person</span>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome</p>
                                    <p className="text-sm font-black text-white">Rodrigo Campanato</p>
                                </div>
                                <span className="material-symbols-outlined text-blue-400">edit</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500">mail</span>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
                                    <p className="text-sm font-black text-white">rodrigo@personal.com</p>
                                </div>
                                <span className="material-symbols-outlined text-blue-400">edit</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowEditProfile(false)}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
