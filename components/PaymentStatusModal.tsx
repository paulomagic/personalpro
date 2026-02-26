import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, AlertTriangle, CreditCard, Banknote, Smartphone, Building } from 'lucide-react';

interface PaymentStatusModalProps {
    payment: {
        id: string;
        clientName: string;
        amount: number;
        status: 'paid' | 'pending' | 'overdue';
        dueDate: string;
        paymentMethod?: string;
    };
    onClose: () => void;
    onUpdateStatus: (id: string, status: 'paid' | 'pending' | 'overdue', method?: string) => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
    payment,
    onClose,
    onUpdateStatus
}) => {
    const [selectedStatus, setSelectedStatus] = useState<'paid' | 'pending' | 'overdue'>(payment.status);
    const [selectedMethod, setSelectedMethod] = useState(payment.paymentMethod || 'pix');
    const [saving, setSaving] = useState(false);

    const statusOptions = [
        { value: 'paid', label: 'Pago', icon: Check, color: 'emerald', bg: 'bg-emerald-500' },
        { value: 'pending', label: 'Pendente', icon: Clock, color: 'amber', bg: 'bg-blue-500' },
        { value: 'overdue', label: 'Atrasado', icon: AlertTriangle, color: 'red', bg: 'bg-red-500' }
    ] as const;

    const methodOptions = [
        { value: 'pix', label: 'PIX', icon: Smartphone },
        { value: 'cash', label: 'Dinheiro', icon: Banknote },
        { value: 'card', label: 'Cartão', icon: CreditCard },
        { value: 'transfer', label: 'Transferência', icon: Building }
    ];

    const handleSave = () => {
        setSaving(true);
        onUpdateStatus(payment.id, selectedStatus, selectedStatus === 'paid' ? selectedMethod : undefined);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-slate-900 rounded-[32px] p-6 border border-white/10"
                >
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={onClose}
                            className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
                        >
                            <span>←</span> Voltar
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-1">{payment.clientName}</h2>
                        <p className="text-sm text-gray-400">R$ {payment.amount} • {payment.dueDate}</p>
                    </div>

                    {/* Status Selection */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = selectedStatus === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedStatus(option.value)}
                                        className={`py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all ${isSelected
                                            ? `${option.bg} text-white`
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Method (only when paid) */}
                    {selectedStatus === 'paid' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6"
                        >
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Método</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {methodOptions.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = selectedMethod === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            onClick={() => setSelectedMethod(method.value)}
                                            className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${isSelected
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-[8px] font-bold uppercase">{method.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                            'SALVAR'
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PaymentStatusModal;
