import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface FinanceViewProps {
    onBack: () => void;
}

interface Payment {
    id: string;
    clientName: string;
    clientAvatar: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
    plan: string;
    phone?: string;
}

const financeData = [
    { month: 'Jul', amount: 4500 },
    { month: 'Ago', amount: 5200 },
    { month: 'Set', amount: 4900 },
    { month: 'Out', amount: 6100 },
    { month: 'Nov', amount: 5800 },
    { month: 'Dez', amount: 7250 },
];

const FinanceView: React.FC<FinanceViewProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history'>('overview');
    const [showPaymentModal, setShowPaymentModal] = useState<Payment | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

    const [payments, setPayments] = useState<Payment[]>([
        { id: '1', clientName: 'Ana Silva', clientAvatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100', amount: 450, dueDate: '05/01', status: 'paid', plan: 'Mensal', phone: '5561999999999' },
        { id: '2', clientName: 'Carlos Mendes', clientAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=100', amount: 450, dueDate: '10/01', status: 'pending', plan: 'Mensal', phone: '5561988888888' },
        { id: '3', clientName: 'Júlia Costa', clientAvatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100', amount: 800, dueDate: '15/01', status: 'pending', plan: 'Trimestral', phone: '5561977777777' },
        { id: '4', clientName: 'Ricardo Sousa', clientAvatar: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=100', amount: 450, dueDate: '20/12', status: 'overdue', plan: 'Mensal', phone: '5561966666666' },
        { id: '5', clientName: 'Marina Santos', clientAvatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100', amount: 450, dueDate: '25/01', status: 'pending', plan: 'Mensal', phone: '5561955555555' },
    ]);

    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');

    const stats = {
        monthlyRevenue: paidPayments.reduce((acc, p) => acc + p.amount, 0) + 10000,
        pending: pendingPayments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
        overdue: pendingPayments.filter(p => p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0),
        clients: 15
    };

    const showToast = (message: string) => {
        setShowSuccessToast(message);
        setTimeout(() => setShowSuccessToast(null), 3000);
    };

    const handleSendReminder = (payment: Payment) => {
        const message = `Olá ${payment.clientName}! 👋\n\nEspero que esteja bem! 😊\n\nGostaria de lembrar sobre a mensalidade do plano ${payment.plan}:\n\n💰 Valor: R$ ${payment.amount}\n📅 Vencimento: ${payment.dueDate}\n\nQualquer dúvida, estou à disposição!\n\nAbraços,\nRodrigo Campanato`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${payment.phone}?text=${encoded}`, '_blank');
    };

    const handleMarkAsPaid = (payment: Payment) => {
        setPayments(prev => prev.map(p =>
            p.id === payment.id ? { ...p, status: 'paid' as const } : p
        ));
        setShowPaymentModal(null);
        showToast(`Pagamento de ${payment.clientName} registrado!`);
    };

    const handleSendMassReminder = () => {
        const pending = pendingPayments.filter(p => p.status !== 'paid');
        if (pending.length === 0) {
            showToast('Não há pagamentos pendentes!');
            return;
        }

        const names = pending.map(p => p.clientName).join(', ');
        showToast(`Lembretes enviados para: ${names}`);
    };

    const handleGenerateReport = () => {
        const report = `📊 RELATÓRIO FINANCEIRO - DEZEMBRO 2024\n\n` +
            `💰 Receita Total: R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}\n` +
            `⏳ Pendente: R$ ${stats.pending.toLocaleString('pt-BR')}\n` +
            `⚠️ Atrasado: R$ ${stats.overdue.toLocaleString('pt-BR')}\n` +
            `👥 Total de Alunos: ${stats.clients}\n\n` +
            `--- PAGAMENTOS PENDENTES ---\n` +
            pendingPayments.map(p => `• ${p.clientName}: R$ ${p.amount} (${p.status === 'overdue' ? 'ATRASADO' : 'Pendente'})`).join('\n');

        // Copy to clipboard
        navigator.clipboard.writeText(report);
        showToast('Relatório copiado para área de transferência!');
    };

    const displayPayments = activeTab === 'pending'
        ? pendingPayments
        : activeTab === 'history'
            ? paidPayments
            : pendingPayments;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-md mx-auto min-h-screen text-white p-6 pb-32"
        >
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-slide-down">
                    <div className="glass-card bg-emerald-500/10 border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl shadow-glow flex items-center gap-3">
                        <CheckCircle size={20} />
                        <span className="font-black text-xs uppercase tracking-widest">{showSuccessToast}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <motion.header variants={itemVariants} className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-black tracking-tight">Financeiro</h1>
            </motion.header>

            {/* Main Chart */}
            <motion.div variants={itemVariants} className="bg-slate-900 rounded-[32px] border border-white/5 p-6 relative overflow-hidden shadow-2xl mb-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 mb-6">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Receita Mensal</p>
                    <div className="flex items-end gap-3">
                        <h2 className="text-4xl font-black text-white">R$ 7.250</h2>
                        <span className="mb-1 text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <TrendingUp size={12} /> +15%
                        </span>
                    </div>
                </div>

                <div className="h-40 w-full -ml-4">
                    <ResponsiveContainer width="110%" height="100%">
                        <AreaChart data={financeData}>
                            <defs>
                                <linearGradient id="colorFin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Tooltip
                                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ color: '#10B981' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorFin)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* List Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-white">Transações Recentes</h3>
                <button
                    onClick={handleGenerateReport}
                    className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <Download size={18} />
                </button>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="bg-slate-900/50 p-1 rounded-2xl flex relative mb-6">
                {['overview', 'pending', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all relative z-10 ${activeTab === tab ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {tab === 'overview' ? 'Geral' : tab === 'pending' ? 'Cobranças' : 'Histórico'}
                    </button>
                ))}
                <div
                    className="absolute top-1 bottom-1 bg-slate-800 rounded-xl transition-all duration-300 shadow-md"
                    style={{
                        left: activeTab === 'overview' ? '4px' : activeTab === 'pending' ? 'calc(33.33% + 2px)' : 'calc(66.66%)',
                        width: 'calc(33.33% - 4px)'
                    }}
                ></div>
            </motion.div>

            {/* Actions for Pending */}
            {activeTab === 'pending' && (
                <motion.div variants={itemVariants} className="mb-6">
                    <button
                        onClick={handleSendMassReminder}
                        className="w-full py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500/20 active:scale-[0.98] transition-all"
                    >
                        <AlertCircle size={18} />
                        Enviar Lembrete em Massa ({pendingPayments.filter(p => p.status !== 'paid').length})
                    </button>
                </motion.div>
            )}

            {/* Payments List */}
            <motion.div variants={itemVariants} className="space-y-3">
                {displayPayments.map((payment) => (
                    <div
                        key={payment.id}
                        className="glass-card rounded-[24px] p-4 flex items-center gap-4 group active:scale-[0.98] transition-all cursor-pointer hover:border-white/10"
                        onClick={() => setShowPaymentModal(payment)}
                    >
                        <div className="relative">
                            <div
                                className="size-12 rounded-xl bg-cover bg-center border border-white/10"
                                style={{ backgroundImage: `url(${payment.clientAvatar})` }}
                            />
                            <div className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-slate-900 
                                ${payment.status === 'paid' ? 'bg-emerald-500' : payment.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'}`}
                            >
                                {payment.status === 'paid' ? <CheckCircle size={10} className="text-slate-900" /> :
                                    payment.status === 'overdue' ? <AlertCircle size={10} className="text-white" /> :
                                        <Clock size={10} className="text-slate-900" />}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{payment.clientName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{payment.plan} • {payment.dueDate}</p>
                        </div>

                        <div className="text-right">
                            <p className="font-black text-white">R$ {payment.amount}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'text-emerald-400' :
                                    payment.status === 'overdue' ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                            </p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
                    <div className="w-full bg-slate-900 border border-white/10 rounded-[40px] p-6 animate-slide-up shadow-2xl relative">
                        <button onClick={() => setShowPaymentModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                            <TrendingUp size={24} className="rotate-45" />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div
                                className="size-20 rounded-[28px] bg-cover bg-center border-4 border-slate-800 shadow-xl mb-3"
                                style={{ backgroundImage: `url(${showPaymentModal.clientAvatar})` }}
                            />
                            <h3 className="text-xl font-black text-white">{showPaymentModal.clientName}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mensalidade {showPaymentModal.plan}</p>
                        </div>

                        <div className="bg-slate-950/50 rounded-2xl p-4 mb-6 text-center border border-white/5">
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Valor Pendente</p>
                            <p className="text-3xl font-black text-white">R$ {showPaymentModal.amount}</p>
                        </div>

                        <div className="space-y-3">
                            {showPaymentModal.status !== 'paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(showPaymentModal)}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-glow hover:bg-emerald-400"
                                >
                                    <CheckCircle size={20} />
                                    Confirmar Pagamento
                                </button>
                            )}

                            <button
                                onClick={() => handleSendReminder(showPaymentModal)}
                                className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-700"
                            >
                                <span className="material-symbols-outlined">chat</span>
                                Enviar Cobrança no WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default FinanceView;
