import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Target, TrendingUp, FileText, AlertTriangle, Heart } from 'lucide-react';
import { Client } from '../types';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Partial<Client>) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'notes'>('basic');

    // Basic Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatar, setAvatar] = useState('');

    // Details
    const [goal, setGoal] = useState('Hipertrofia');
    const [level, setLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta'>('Iniciante');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Notes
    const [observations, setObservations] = useState('');
    const [injuries, setInjuries] = useState('');
    const [preferences, setPreferences] = useState('');

    const goals = [
        'Hipertrofia',
        'Perda de Peso',
        'Condicionamento',
        'Força Máxima',
        'Bem-estar',
        'Definição',
        'Reabilitação',
        'Performance Esportiva'
    ];

    const levels: Array<'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta'> = [
        'Iniciante',
        'Intermediário',
        'Avançado',
        'Atleta'
    ];

    const handleSave = () => {
        if (!name.trim()) {
            alert('Nome é obrigatório');
            return;
        }

        // Validate email format if provided
        if (email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                alert('Formato de email inválido');
                return;
            }
        }

        const newClient: Partial<Client> = {
            // Note: Don't set id here - Supabase will generate UUID automatically
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            birthDate: birthDate || undefined,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=200`,
            goal,
            level,
            startDate,
            status: 'active',
            adherence: 0,
            lastTraining: 'Novo aluno',
            paymentStatus: 'pending',
            observations: observations.trim() || undefined,
            injuries: injuries.trim() || undefined,
            preferences: preferences.trim() || undefined,
            missedClasses: [],
            assessments: [],
            totalClasses: 0,
            completedClasses: 0,
        };

        onSave(newClient);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setBirthDate('');
        setAvatar('');
        setGoal('Hipertrofia');
        setLevel('Iniciante');
        setStartDate(new Date().toISOString().split('T')[0]);
        setObservations('');
        setInjuries('');
        setPreferences('');
        setActiveTab('basic');
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-slate-900 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-white">Novo Aluno</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Cadastro de Protocolo</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {[
                        { id: 'basic', label: 'Básico', icon: User },
                        { id: 'details', label: 'Detalhes', icon: Target },
                        { id: 'notes', label: 'Notas', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {activeTab === 'basic' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            {/* Name */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white font-bold outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="Ex: Maria Silva"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white font-bold outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="maria@email.com"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Telefone / WhatsApp
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            // Extract digits
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 11);

                                            // Apply mask (xx) xxxxx-xxxx
                                            let formatted = '';
                                            if (digits.length > 0) formatted += `(${digits.slice(0, 2)}`;
                                            if (digits.length > 2) formatted += `) ${digits.slice(2, 7)}`;
                                            if (digits.length > 7) formatted += `-${digits.slice(7)}`;

                                            setPhone(formatted);
                                        }}
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white font-bold outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            {/* Birth Date */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Data de Nascimento
                                </label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'details' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            {/* Goal */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    <Target size={12} className="inline mr-1" />
                                    Objetivo Principal
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {goals.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGoal(g)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${goal === g
                                                ? 'bg-blue-600 text-white shadow-glow'
                                                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Level */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    <TrendingUp size={12} className="inline mr-1" />
                                    Nível de Experiência
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {levels.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setLevel(l)}
                                            className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all ${level === l
                                                ? 'bg-purple-600 text-white shadow-glow'
                                                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'
                                                }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Data de Início
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notes' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            {/* Observations */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    <FileText size={12} className="inline mr-1" />
                                    Observações Gerais
                                </label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white font-medium outline-none focus:border-blue-500/50 transition-colors resize-none"
                                    placeholder="Ex: Prefere treinar pela manhã, tem disponibilidade 3x por semana..."
                                    rows={3}
                                />
                            </div>

                            {/* Injuries */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    <AlertTriangle size={12} className="inline mr-1 text-amber-500" />
                                    Lesões / Restrições
                                </label>
                                <textarea
                                    value={injuries}
                                    onChange={(e) => setInjuries(e.target.value)}
                                    className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl py-3 px-4 text-white font-medium outline-none focus:border-amber-500/50 transition-colors resize-none"
                                    placeholder="Ex: Hérnia de disco L4-L5, evitar impacto no joelho esquerdo..."
                                    rows={2}
                                />
                            </div>

                            {/* Preferences */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    <Heart size={12} className="inline mr-1 text-pink-500" />
                                    Preferências de Treino
                                </label>
                                <textarea
                                    value={preferences}
                                    onChange={(e) => setPreferences(e.target.value)}
                                    className="w-full bg-pink-500/5 border border-pink-500/20 rounded-xl py-3 px-4 text-white font-medium outline-none focus:border-pink-500/50 transition-colors resize-none"
                                    placeholder="Ex: Ama treino de glúteo, gosta de Drop-Sets, prefere música alta..."
                                    rows={2}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex gap-3">
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-glow hover:bg-blue-500 transition-all active:scale-95"
                    >
                        Salvar Aluno
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AddClientModal;
