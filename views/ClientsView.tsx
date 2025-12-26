
import React from 'react';
import { Client } from '../types';

interface ClientsViewProps {
    onBack: () => void;
    onSelectClient: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ onBack, onSelectClient }) => {
    const clients: Client[] = [
        { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Intermediário', adherence: 75, lastTraining: 'Leg Day • 14:30', status: 'active' },
        { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Perda de Peso', level: 'Iniciante', adherence: 40, lastTraining: 'Cardio • Pendente', status: 'at-risk' },
        { id: '3', name: 'Júlia Costa', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', goal: 'Força', level: 'Avançado', adherence: 95, lastTraining: 'Descanso', status: 'active' },
        { id: '4', name: 'Ricardo Sousa', avatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=200&h=200&fit=crop', goal: 'Condicionamento', level: 'Intermediário', adherence: 20, lastTraining: '3 dias atrás', status: 'at-risk' },
        { id: '5', name: 'Marina Santos', avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Avançado', adherence: 90, lastTraining: 'Push Day • Hoje', status: 'active' },
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
            {/* Header */}
            <header className="px-6 pt-14 pb-8 flex items-center gap-4 animate-fade-in">
                <button onClick={onBack} className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-white tracking-tight">Alunos</h1>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Base de Elite</p>
                </div>
                <button className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-glow active:scale-95 transition-all">
                    <span className="material-symbols-outlined font-black">add</span>
                </button>
            </header>

            {/* Stats Row */}
            <div className="px-6 grid grid-cols-3 gap-3 mb-8 animate-slide-up">
                <div className="glass-card rounded-[24px] p-4 text-center border-b-2 border-slate-700">
                    <p className="text-xl font-black text-white">15</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                </div>
                <div className="glass-card rounded-[24px] p-4 text-center border-b-2 border-emerald-500">
                    <p className="text-xl font-black text-emerald-400">12</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ativos</p>
                </div>
                <div className="glass-card rounded-[24px] p-4 text-center border-b-2 border-amber-500">
                    <p className="text-xl font-black text-amber-400">3</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alerta</p>
                </div>
            </div>

            {/* Search Shell */}
            <div className="px-6 mb-8 animate-slide-up stagger-1">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Buscar Protocolo..."
                        className="w-full h-16 pl-14 pr-6 rounded-3xl glass-card bg-white/5 border-white/5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-bold text-sm"
                    />
                </div>
            </div>

            {/* Clients List */}
            <div className="px-6 space-y-4 animate-slide-up stagger-2">
                {clients.map((client) => (
                    <button
                        key={client.id}
                        onClick={() => onSelectClient(client)}
                        className="w-full glass-card rounded-[32px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all group text-left hover:border-blue-500/30"
                    >
                        <div className="relative">
                            <div
                                className="size-16 rounded-[24px] bg-cover bg-center border-2 border-white/10 group-hover:border-blue-500/30 transition-colors shadow-xl"
                                style={{ backgroundImage: `url(${client.avatar})` }}
                            />
                            <span className={`absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-slate-950 ${client.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                client.status === 'at-risk' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-300'
                                }`}></span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-black text-white text-sm tracking-tight">{client.name}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">{client.level}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{client.goal}</p>
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${client.adherence}%` }}></div>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">{client.lastTraining}</p>
                        </div>

                        <span className="material-symbols-outlined text-slate-700 group-hover:text-blue-500 transition-colors">chevron_right</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClientsView;
