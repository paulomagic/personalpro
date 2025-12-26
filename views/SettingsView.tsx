
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
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-8">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 z-30">
                <button onClick={onBack} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
            </header>

            {/* Profile Card */}
            <div className="p-6">
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 flex items-center gap-4">
                    <div
                        className="size-16 rounded-full bg-cover bg-center border-2 border-white shadow-lg"
                        style={{ backgroundImage: 'url(/coach-rodrigo.png)' }}
                    />
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-900">Rodrigo Campanato</h2>
                        <p className="text-sm text-slate-400">rodrigo@personaltrainer.com</p>
                    </div>
                    <button className="size-10 rounded-full bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500">edit</span>
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-6 space-y-3">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        className="w-full bg-white rounded-[20px] p-4 border border-slate-100 flex items-center gap-4 active:scale-[0.99] transition-all text-left"
                    >
                        <div className="size-11 rounded-xl bg-slate-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-600">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{item.label}</h4>
                            <p className="text-xs text-slate-400">{item.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="px-6 mt-8">
                <button
                    onClick={onLogout}
                    className="w-full bg-red-50 rounded-[20px] p-4 flex items-center justify-center gap-3 text-red-600 font-semibold active:scale-[0.99] transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Sair da Conta
                </button>
            </div>

            {/* Version */}
            <p className="text-center text-xs text-slate-300 mt-8">Versão 1.0.0</p>
        </div>
    );
};

export default SettingsView;
