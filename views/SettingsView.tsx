
import React from 'react';

interface SettingsViewProps {
    onBack: () => void;
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
    const menuItems = [
        { icon: 'person', label: 'Meus Dados', subtitle: 'Nome, email, foto' },
        { icon: 'notifications', label: 'Notificações', subtitle: 'Push e email' },
        { icon: 'palette', label: 'Aparência', subtitle: 'Tema e cores' },
        { icon: 'security', label: 'Segurança', subtitle: 'Senha e 2FA' },
        { icon: 'credit_card', label: 'Assinatura', subtitle: 'Plano Premium' },
        { icon: 'help', label: 'Ajuda', subtitle: 'FAQ e suporte' },
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
            {/* Header */}
            <header className="px-6 pt-14 pb-8 flex items-center gap-4 animate-fade-in">
                <button
                    onClick={onBack}
                    className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Configurações</h1>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ajustes Elite</p>
                </div>
            </header>

            {/* Profile Card */}
            <div className="px-6 mb-8 animate-slide-up">
                <div className="glass-card rounded-[32px] p-6 flex items-center gap-4 shadow-glow">
                    <div
                        className="size-16 rounded-full bg-cover bg-center border-2 border-white/20 shadow-xl"
                        style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
                    />
                    <div className="flex-1">
                        <h2 className="text-lg font-black text-white">Rodrigo Campanato</h2>
                        <p className="text-xs font-bold text-slate-500">rodrigo@personaltrainer.com</p>
                    </div>
                    <button className="size-10 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-blue-400">edit</span>
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-6 space-y-3 animate-slide-up stagger-1">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        className="w-full glass-card rounded-[24px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all duration-300 text-left hover:border-blue-500/30"
                    >
                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white text-sm">{item.label}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-700">chevron_right</span>
                    </button>
                ))}
            </div>

            {/* Sair */}
            <div className="px-6 mt-12 animate-slide-up stagger-2">
                <button
                    onClick={onLogout}
                    className="w-full h-16 bg-red-500/10 border border-red-500/20 text-red-500 font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Finalizar Sessão
                </button>
            </div>

            {/* Version */}
            <p className="text-center text-[9px] font-black text-slate-700 mt-12 uppercase tracking-[0.3em]">Apex Elite Framework • v1.1.0</p>
        </div>
    );
};

export default SettingsView;
