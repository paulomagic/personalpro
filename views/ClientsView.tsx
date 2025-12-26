
import React from 'react';
import { Client } from '../types';

interface ClientsViewProps {
    onBack: () => void;
    onSelectClient: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ onBack, onSelectClient }) => {
    const clients: Client[] = [
        { id: '1', name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Intermediário', adherence: 75, lastTraining: 'Leg Day • Em andamento', status: 'active' },
        { id: '2', name: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop', goal: 'Perda de Peso', level: 'Iniciante', adherence: 40, lastTraining: 'Cardio • Pendente', status: 'at-risk' },
        { id: '3', name: 'Júlia Costa', avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', goal: 'Força', level: 'Avançado', adherence: 95, lastTraining: 'Descanso', status: 'active' },
        { id: '4', name: 'Ricardo Sousa', avatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=200&h=200&fit=crop', goal: 'Condicionamento', level: 'Intermediário', adherence: 20, lastTraining: '3 dias atrás', status: 'at-risk' },
        { id: '5', name: 'Marina Santos', avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop', goal: 'Hipertrofia', level: 'Avançado', adherence: 90, lastTraining: 'Push Day • Hoje', status: 'active' },
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-8">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 z-30">
                <button onClick={onBack} className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Alunos</h1>
                <div className="flex-1"></div>
                <button className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">add</span>
                </button>
            </header>

            {/* Stats */}
            <div className="p-6 grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-900">15</p>
                    <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-emerald-600">12</p>
                    <p className="text-xs text-slate-400">Ativos</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-amber-500">3</p>
                    <p className="text-xs text-slate-400">Em risco</p>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 mb-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-slate-100 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 transition-colors"
                    />
                </div>
            </div>

            {/* Clients List */}
            <div className="px-6 space-y-3">
                {clients.map((client) => (
                    <button
                        key={client.id}
                        onClick={() => onSelectClient(client)}
                        className="w-full bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-all text-left"
                    >
                        <div className="relative">
                            <div
                                className="size-14 rounded-full bg-cover bg-center border-2 border-white shadow-md"
                                style={{ backgroundImage: `url(${client.avatar})` }}
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-white ${client.status === 'active' ? 'bg-emerald-500' :
                                    client.status === 'at-risk' ? 'bg-amber-500' : 'bg-slate-300'
                                }`}></span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900">{client.name}</h4>
                                <span className="text-xs font-medium text-slate-400">{client.level}</span>
                            </div>
                            <p className="text-sm text-blue-600 font-medium mt-0.5">{client.goal}</p>
                            <p className="text-xs text-slate-400 mt-1">{client.lastTraining}</p>
                        </div>

                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClientsView;
