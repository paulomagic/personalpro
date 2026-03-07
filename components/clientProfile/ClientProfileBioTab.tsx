import React from 'react';
import { motion } from 'framer-motion';
import { Edit, FileText, Mail, Phone, Save } from 'lucide-react';
import type { Client } from '../../types';
import ClientFinanceSection from '../ClientFinanceSection';
import { ClientPhysicalDataForm } from '../ClientPhysicalDataForm';

interface ClientProfileBioTabProps {
    client: Client;
    coachId?: string;
    onFinanceUpdate: (updates: Record<string, unknown>) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    handleSaveNotes: () => void;
    onOpenContactModal: () => void;
    editedObservations: string;
    setEditedObservations: (value: string) => void;
    editedInjuries: string;
    setEditedInjuries: (value: string) => void;
    editedPreferences: string;
    setEditedPreferences: (value: string) => void;
    onUpdatePhysicalData: (data: Record<string, unknown>) => Promise<void>;
}

const ClientProfileBioTab: React.FC<ClientProfileBioTabProps> = ({
    client,
    coachId,
    onFinanceUpdate,
    isEditing,
    setIsEditing,
    handleSaveNotes,
    onOpenContactModal,
    editedObservations,
    setEditedObservations,
    editedInjuries,
    setEditedInjuries,
    editedPreferences,
    setEditedPreferences,
    onUpdatePhysicalData
}) => {
    return (
        <motion.div
            key="bio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Phone size={14} className="text-blue-400" />
                        Contato
                    </h3>
                    <button
                        onClick={onOpenContactModal}
                        className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all"
                    >
                        <Edit size={12} className="inline mr-1" /> Editar
                    </button>
                </div>
                {client.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Mail size={14} className="text-slate-500" />
                        {client.email}
                    </div>
                )}
                {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Phone size={14} className="text-slate-500" />
                        {client.phone}
                        <a
                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold"
                        >
                            WhatsApp
                        </a>
                    </div>
                )}
            </div>

            <ClientFinanceSection
                client={{
                    id: client.id,
                    name: client.name,
                    coach_id: coachId,
                    monthly_fee: (client as any).monthly_fee,
                    payment_day: (client as any).payment_day,
                    payment_type: (client as any).payment_type,
                    session_price: (client as any).session_price,
                }}
                coachId={coachId}
                onUpdate={onFinanceUpdate}
            />

            <ClientPhysicalDataForm
                age={client.age}
                weight={client.weight}
                height={client.height}
                bodyFat={client.bodyFat}
                compact={false}
                readOnly={false}
                onUpdate={onUpdatePhysicalData}
            />

            <div className="glass-card rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        Notas do Aluno
                    </h3>
                    <button
                        onClick={() => isEditing ? handleSaveNotes() : setIsEditing(true)}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${isEditing
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                    >
                        {isEditing ? <><Save size={12} className="inline mr-1" /> Salvar</> : <><Edit size={12} className="inline mr-1" /> Editar</>}
                    </button>
                </div>

                <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        📝 Observações Gerais
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedObservations}
                            onChange={(event) => setEditedObservations(event.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                            rows={2}
                            placeholder="Observações gerais sobre o aluno..."
                        />
                    ) : (
                        <p className="text-sm text-slate-300">
                            {client.observations || <span className="text-slate-500 italic">Sem observações</span>}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                        ⚠️ Lesões / Restrições
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedInjuries}
                            onChange={(event) => setEditedInjuries(event.target.value)}
                            className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                            rows={2}
                            placeholder="Lesões e restrições de movimento..."
                        />
                    ) : (
                        <p className="text-sm text-slate-300">
                            {client.injuries || <span className="text-slate-500 italic">Nenhuma lesão registrada</span>}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">
                        ❤️ Preferências de Treino
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedPreferences}
                            onChange={(event) => setEditedPreferences(event.target.value)}
                            className="w-full bg-pink-500/5 border border-pink-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-pink-500/50 resize-none"
                            rows={2}
                            placeholder="Exercícios favoritos, estilos de treino..."
                        />
                    ) : (
                        <p className="text-sm text-slate-300">
                            {client.preferences || <span className="text-slate-500 italic">Sem preferências registradas</span>}
                        </p>
                    )}
                </div>
            </div>

            <div className="glass-card rounded-2xl p-4">
                <h3 className="font-bold text-white text-sm mb-3">📅 Datas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Início</p>
                        <p className="text-white font-bold">{client.startDate ? new Date(client.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Último Treino</p>
                        <p className="text-white font-bold">{client.lastTraining}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ClientProfileBioTab;
