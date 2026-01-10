import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, Edit, Save, X, Repeat, Plus, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { updateClient, DBClient, createPayment, getPaymentsByClient, Payment } from '../services/supabaseClient';

interface ClientFinanceSectionProps {
    client: {
        id: string;
        name: string;
        coach_id?: string;
        monthly_fee?: number;
        payment_day?: number;
        payment_type?: 'monthly' | 'per_session';
        session_price?: number;
    };
    coachId?: string;
    onUpdate?: (updates: Partial<DBClient>) => void;
}

const ClientFinanceSection: React.FC<ClientFinanceSectionProps> = ({ client, coachId, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [registeringSession, setRegisteringSession] = useState(false);
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
        try {
            const result = await updateClient(client.id, formData);
            if (result && onUpdate) {
                onUpdate(formData);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving finance data:', error);
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

    const fetchPayments = async () => {
        setLoadingPayments(true);
        const data = await getPaymentsByClient(client.id);
        setPayments(data);
        setLoadingPayments(false);
    };

    const handleToggleHistory = () => {
        if (!showHistory && payments.length === 0) {
            fetchPayments();
        }
        setShowHistory(!showHistory);
    };

    const handleRegisterSession = async () => {
        if (!coachId && !client.coach_id) return;
        setRegisteringSession(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const payment = await createPayment({
                client_id: client.id,
                coach_id: coachId || client.coach_id || '',
                amount: formData.session_price,
                due_date: today,
                paid_date: today,
                status: 'paid',
                plan: 'Diária',
                payment_method: 'pix',
                type: 'session'
            });
            if (payment) {
                setPayments(prev => [payment, ...prev]);
            }
        } catch (error) {
            console.error('Error registering session:', error);
        } finally {
            setRegisteringSession(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'paid':
                return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Pago' };
            case 'overdue':
                return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Atrasado' };
            default:
                return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pendente' };
        }
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
                <>
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

                    {/* Register Session Button (only for per_session) */}
                    {formData.payment_type === 'per_session' && (
                        <button
                            onClick={handleRegisterSession}
                            disabled={registeringSession}
                            className="w-full mt-3 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {registeringSession ? (
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Registrar Sessão (R$ {formData.session_price})
                                </>
                            )}
                        </button>
                    )}

                    {/* Payment History Toggle */}
                    <button
                        onClick={handleToggleHistory}
                        className="w-full mt-3 py-2 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Histórico de Pagamentos
                    </button>

                    {/* Payment History */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                    {loadingPayments ? (
                                        <div className="py-4 text-center">
                                            <div className="size-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </div>
                                    ) : payments.length > 0 ? (
                                        payments.map((payment) => {
                                            const config = getStatusConfig(payment.status);
                                            const StatusIcon = config.icon;
                                            return (
                                                <div
                                                    key={payment.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg ${config.bg}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon size={14} className={config.color} />
                                                        <div>
                                                            <p className="text-xs font-bold text-white">R$ {payment.amount}</p>
                                                            <p className="text-[10px] text-slate-500">{formatDate(payment.due_date)}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-500 text-center py-4">
                                            Nenhum pagamento registrado
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};

export default ClientFinanceSection;
