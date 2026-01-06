import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getPayments, updatePayment, getClients } from '../services/supabaseClient';
import { mockClients } from '../mocks/demoData';
import { PaymentCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

interface FinanceViewProps {
    user: any;
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

const FinanceView: React.FC<FinanceViewProps> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history'>('overview');
    const [showPaymentModal, setShowPaymentModal] = useState<Payment | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<Payment[]>([]);

    // Fetch payments from Supabase
    useEffect(() => {
        const fetchPayments = async () => {
            if (!user?.id) return;
            setLoading(true);

            try {
                // Demo Mode handling
                if (user.isDemo) {
                    const demoPayments = mockClients.slice(0, 5).map((c: any, i: number) => ({
                        id: `demo-${i}`,
                        clientName: c.name,
                        clientAvatar: c.avatar || c.avatar_url || '',
                        amount: 350,
                        dueDate: new Date(new Date().setDate(15 + i)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue' as any,
                        plan: 'Premium',
                        phone: c.phone || ''
                    }));
                    setPayments(demoPayments);
                    setLoading(false);
                    return;
                }

                const dbPayments = await getPayments(user.id);

                if (dbPayments.length > 0) {
                    // Map DB payments to our interface
                    const mapped = dbPayments.map((p: any) => ({
                        id: p.id,
                        clientName: p.clients?.name || 'Cliente',
                        clientAvatar: p.clients?.avatar_url || '',
                        amount: p.amount,
                        dueDate: new Date(p.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        status: p.status as 'paid' | 'pending' | 'overdue',
                        plan: p.plan || 'Mensal',
                        phone: p.clients?.phone || ''
                    }));
                    setPayments(mapped);
                } else {
                    // Fallback: Generate demo payments from clients
                    const clients = await getClients(user.id);
                    if (clients.length > 0) {
                        const demoPayments = clients.slice(0, 5).map((c: any, i: number) => ({
                            id: `demo-${i}`,
                            clientName: c.name,
                            clientAvatar: c.avatar_url || '',
                            amount: 350,
                            dueDate: `${15 + i}/12`,
                            status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue' as any,
                            plan: 'Premium',
                            phone: c.phone || ''
                        }));
                        setPayments(demoPayments);
                    }
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user]);

    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');

    const stats = {
        monthlyRevenue: paidPayments.reduce((acc, p) => acc + p.amount, 0),
        pending: pendingPayments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
        overdue: pendingPayments.filter(p => p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0)
    };

    const financeData = [
        { month: 'Set', amount: 4900 },
        { month: 'Out', amount: 6100 },
        { month: 'Nov', amount: 5800 },
        { month: 'Hoje', amount: stats.monthlyRevenue || 800 },
    ];

    const showToast = (message: string) => {
        setShowSuccessToast(message);
        setTimeout(() => setShowSuccessToast(null), 3000);
    };

    const handleSendReminder = (payment: Payment) => {
        const phone = payment.phone || '';
        const message = `Olá ${payment.clientName}! 🏋️‍♂️\n\nPassando para lembrar que sua fatura do *Plano ${payment.plan}* (vencimento ${payment.dueDate}) no valor de R$ ${payment.amount} está pendente.\n\nQualquer dúvida estou à disposição!`;

        const link = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(link, '_blank');

        showToast(`WhatsApp aberto para cobrança de ${payment.clientName}!`);
        setShowPaymentModal(null);
    };

    const handleMarkAsPaid = async (payment: Payment) => {
        // Update local state immediately
        setPayments(prev => prev.map(p =>
            p.id === payment.id ? { ...p, status: 'paid' as const } : p
        ));
        setShowPaymentModal(null);

        // Persist to database if not a demo payment
        if (!payment.id.startsWith('demo-')) {
            const result = await updatePayment(payment.id, {
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0]
            });
            if (result) {
                showToast(`Pagamento de ${payment.clientName} salvo!`);
            } else {
                showToast(`Pagamento registrado localmente`);
            }
        } else {
            showToast(`Pagamento de ${payment.clientName} registrado!`);
        }
    };

    const handleGenerateReport = () => {
        const report = `📊 RELATÓRIO FINANCEIRO - APEX ULTRA\n\n` +
            `💰 Receita Confirmada: R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}\n` +
            `⏳ Pendente: R$ ${stats.pending.toLocaleString('pt-BR')}\n` +
            `⚠️ Atrasado: R$ ${stats.overdue.toLocaleString('pt-BR')}\n\n` +
            `--- PAGAMENTOS PENDENTES ---\n` +
            pendingPayments.map(p => `• ${p.clientName}: R$ ${p.amount} (${p.status === 'overdue' ? 'ATRASADO' : 'Pendente'})`).join('\n');

        navigator.clipboard.writeText(report);
        showToast('Relatório copiado para área de transferência!');
    };

    const displayPayments = activeTab === 'pending'
        ? pendingPayments
        : activeTab === 'history'
            ? paidPayments
            : payments.slice(0, 10);

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
            {showSuccessToast && (
                <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-slide-down">
                    <div className="glass-card bg-emerald-500/10 border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl shadow-glow flex items-center gap-3">
                        <CheckCircle size={20} />
                        <span className="font-black text-xs uppercase tracking-widest">{showSuccessToast}</span>
                    </div>
                </div>
            )}

            <motion.header variants={itemVariants} className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Financeiro</h1>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Fluxo de Caixa Elite</p>
                </div>
            </motion.header>

            {loading ? (
                <div className="space-y-4">
                    <div className="h-48 rounded-[32px] bg-slate-800/50 animate-pulse" />
                    <PaymentCardSkeleton />
                    <PaymentCardSkeleton />
                    <PaymentCardSkeleton />
                </div>
            ) : (
                <>
                    <motion.div variants={itemVariants} className="bg-slate-900 rounded-[32px] border border-white/5 p-6 relative overflow-hidden shadow-2xl mb-8">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                        <div className="relative z-10 mb-6">
                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Receita Confirmada</p>
                            <div className="flex items-end gap-3">
                                <h2 className="text-4xl font-black text-white">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</h2>
                                <span className="mb-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1 uppercase">
                                    <TrendingUp size={12} /> Live
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

                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Transações</h3>
                        <button onClick={handleGenerateReport} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <Download size={18} />
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-slate-900/50 p-1 rounded-2xl flex relative mb-6">
                        {['overview', 'pending', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all relative z-10 ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}
                            >
                                {tab === 'overview' ? 'Geral' : tab === 'pending' ? 'Cobranças' : 'Histórico'}
                            </button>
                        ))}
                        <div
                            className="absolute top-1 bottom-1 bg-slate-800 rounded-xl transition-all duration-300"
                            style={{
                                left: activeTab === 'overview' ? '4px' : activeTab === 'pending' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 1px)',
                                width: 'calc(33.33% - 4px)'
                            }}
                        ></div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-3">
                        {displayPayments.length > 0 ? (
                            displayPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="glass-card rounded-[24px] p-4 flex items-center gap-4 group active:scale-[0.98] transition-all cursor-pointer"
                                    onClick={() => setShowPaymentModal(payment)}
                                >
                                    <div className="relative">
                                        {payment.clientAvatar ? (
                                            <div className="size-12 rounded-xl bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${payment.clientAvatar})` }} />
                                        ) : (
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 text-slate-500">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-slate-950 
                                            ${payment.status === 'paid' ? 'bg-emerald-500' : payment.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'}`}
                                        >
                                            {payment.status === 'paid' ? <CheckCircle size={10} className="text-slate-950" /> :
                                                payment.status === 'overdue' ? <AlertCircle size={10} className="text-white" /> :
                                                    <Clock size={10} className="text-slate-950" />}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm">{payment.clientName}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{payment.plan} • {payment.dueDate}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-black text-white text-sm">R$ {payment.amount}</p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'text-emerald-400' :
                                            payment.status === 'overdue' ? 'text-red-400' : 'text-amber-400'
                                            }`}>
                                            {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon="receipt_long"
                                title="Nenhuma transação"
                                description="Cadastre pagamentos dos seus alunos para acompanhar o fluxo de caixa"
                                variant="minimal"
                            />
                        )}
                    </motion.div>
                </>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-4 pb-24">
                    <div className="w-full bg-slate-900 border border-white/10 rounded-[40px] p-8 animate-slide-up shadow-2xl relative max-w-sm max-h-[80vh] overflow-y-auto">
                        <button onClick={() => setShowPaymentModal(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="size-20 rounded-[28px] bg-slate-800 border-4 border-slate-800 shadow-xl mb-4 overflow-hidden text-center flex items-center justify-center">
                                {showPaymentModal.clientAvatar ? (
                                    <img src={showPaymentModal.clientAvatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-white">{showPaymentModal.clientName}</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Plano {showPaymentModal.plan}</p>
                        </div>

                        <div className="bg-slate-950/50 rounded-3xl p-6 mb-8 text-center border border-white/5">
                            <p className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-black mb-1">Valor do Protocolo</p>
                            <p className="text-4xl font-black text-white tracking-tighter">R$ {showPaymentModal.amount}</p>
                        </div>

                        <div className="space-y-3">
                            {showPaymentModal.status !== 'paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(showPaymentModal)}
                                    className="w-full h-14 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-glow uppercase text-xs tracking-widest"
                                >
                                    <CheckCircle size={18} />
                                    Confirmar Recebimento
                                </button>
                            )}
                            <button
                                onClick={() => handleSendReminder(showPaymentModal)}
                                className="w-full h-14 rounded-2xl bg-white/5 text-white font-black flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/10 uppercase text-xs tracking-widest"
                            >
                                <span className="material-symbols-outlined text-xl">chat</span>
                                Enviar Via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default FinanceView;
