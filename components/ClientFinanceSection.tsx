import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, CreditCard, Edit, Save, X, Repeat } from 'lucide-react';
import { updateClient, DBClient } from '../services/supabaseClient';

interface ClientFinanceSectionProps {
    client: {
        id: string;
        name: string;
        monthly_fee?: number;
        payment_day?: number;
        payment_type?: 'monthly' | 'per_session';
        session_price?: number;
    };
    onUpdate?: (updates: Partial<DBClient>) => void;
}

const ClientFinanceSection: React.FC<ClientFinanceSectionProps> = ({ client, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        monthly_fee: client.monthly_fee || 350,
        payment_day: client.payment_day || 10,
        payment_type: client.payment_type || 'monthly' as const,
        session_price: client.session_price || 80,
    });

    useEffect(() => {
        setFormData({
            monthly_fee: client.monthly_fee || 350,
            payment_day: client.payment_day || 10,
            payment_type: client.payment_type || 'monthly',
            session_price: client.session_price || 80,
        });
    }, [client]);

    const handleSave = async () => {
        setSaving(true);
        console.log('[FinanceSection] Saving:', { clientId: client.id, formData });
        try {
            const result = await updateClient(client.id, formData);
            console.log('[FinanceSection] Save result:', result);
            if (result && onUpdate) {
                onUpdate(formData);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('[FinanceSection] Error saving finance data:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            monthly_fee: client.monthly_fee || 350,
            payment_day: client.payment_day || 10,
            payment_type: client.payment_type || 'monthly',
            session_price: client.session_price || 80,
        });
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-[28px] p-5 border border-white/5"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Financeiro</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            {formData.payment_type === 'monthly' ? 'Pacote Mensal' : 'Por Sessão'}
                        </p>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="size-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="size-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="size-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="space-y-4">
                    {/* Payment Type Toggle */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Pagamento</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, payment_type: 'monthly' }))}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.payment_type === 'monthly'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                <Calendar size={16} />
                                Mensal
                            </button>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, payment_type: 'per_session' }))}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.payment_type === 'per_session'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                <Repeat size={16} />
                                Diária
                            </button>
                        </div>
                    </div>

                    {/* Monthly Fee / Session Price */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            {formData.payment_type === 'monthly' ? 'Valor Mensal' : 'Valor por Sessão'}
                        </p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                            <input
                                type="number"
                                value={formData.payment_type === 'monthly' ? formData.monthly_fee : formData.session_price}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (formData.payment_type === 'monthly') {
                                        setFormData(prev => ({ ...prev, monthly_fee: value }));
                                    } else {
                                        setFormData(prev => ({ ...prev, session_price: value }));
                                    }
                                }}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Payment Day (only for monthly) */}
                    {formData.payment_type === 'monthly' && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dia do Vencimento</p>
                            <div className="grid grid-cols-7 gap-1">
                                {[1, 5, 10, 15, 20, 25, 30].map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => setFormData(prev => ({ ...prev, payment_day: day }))}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.payment_day === day
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 text-center">
                                Ou digite:
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formData.payment_day}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payment_day: Math.min(31, Math.max(1, Number(e.target.value))) }))}
                                    className="w-12 bg-slate-700 border border-slate-600 rounded px-2 py-1 mx-2 text-white text-center"
                                />
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {/* Value Display */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            {formData.payment_type === 'monthly' ? 'Mensalidade' : 'Por Sessão'}
                        </p>
                        <p className="text-xl font-black text-emerald-400">
                            R$ {formData.payment_type === 'monthly' ? formData.monthly_fee : formData.session_price}
                        </p>
                    </div>

                    {/* Payment Day / Type Display */}
                    <div className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            {formData.payment_type === 'monthly' ? 'Vencimento' : 'Tipo'}
                        </p>
                        <p className="text-xl font-black text-white">
                            {formData.payment_type === 'monthly' ? `Dia ${formData.payment_day}` : 'Diária'}
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ClientFinanceSection;
