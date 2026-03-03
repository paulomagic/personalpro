import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { TrendingUp, Download, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { getPayments, updatePayment } from '../services/supabase/domains/paymentsDomain';
import { getClients } from '../services/supabase/domains/clientsDomain';
import { mockClients } from '../mocks/demoData';
import { PaymentCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';

const FinanceOverviewChart = lazy(() => import('../components/FinanceOverviewChart'));
const PaymentStatusModal = lazy(() => import('../components/PaymentStatusModal'));

interface FinanceViewProps {
    user: any;
    onBack: () => void;
}

interface Payment {
    id: string;
    clientId: string;
    clientName: string;
    clientAvatar: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
    plan: string;
    phone?: string;
    paymentMethod?: string;
}

const FinanceView: React.FC<FinanceViewProps> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history'>('overview');
    const [showPaymentModal, setShowPaymentModal] = useState<Payment | null>(null);
    const [showStatusModal, setShowStatusModal] = useState<Payment | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [enableHeavyUI, setEnableHeavyUI] = useState(false);
    const buildFallbackPayments = useCallback(
        () => mockClients.slice(0, 5).map((c: any, i: number) => ({
            id: `demo-${i}`,
            clientName: c.name,
            clientAvatar: c.avatar || c.avatar_url || '',
            amount: 350 + i * 50,
            dueDate: new Date(new Date().setDate(10 + i)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'pending' : 'overdue' as any,
            plan: 'Premium',
            phone: c.phone || '',
        })),
        []
    );

    useEffect(() => {
        const timer = window.setTimeout(() => setEnableHeavyUI(true), 0);
        return () => window.clearTimeout(timer);
    }, []);

    // Fetch payments from Supabase
    useEffect(() => {
        const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
            return await Promise.race([
                promise,
                new Promise<T>((_, reject) =>
                    window.setTimeout(() => reject(new Error('Finance fetch timeout')), timeoutMs)
                )
            ]);
        };

        const fetchPayments = async () => {
            if (!user?.id) {
                // Demo fallback sem user.id
                setPayments(buildFallbackPayments());
                setLoading(false);
                return;
            }
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

                    const dbPayments = await withTimeout(getPayments(user.id));

                if (dbPayments.length > 0) {
                    // Map DB payments to our interface
                    const mapped = dbPayments.map((p: any) => ({
                        id: p.id,
                        clientId: p.client_id,
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
                        const clients = await withTimeout(getClients(user.id, { limit: 120 }));
                    if (clients.length > 0) {
                        const demoPayments = clients.slice(0, 5).map((c: any, i: number) => ({
                            id: `demo-${i}`,
                            clientId: c.id,
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
                // Fallback para evitar tela vazia caso a rede trave
                setPayments(buildFallbackPayments());
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user, buildFallbackPayments]);

    // Failsafe visual: evita tela "vazia" se a request travar
    useEffect(() => {
        if (!loading) return;
        const timer = window.setTimeout(() => {
            setPayments((prev) => (prev.length > 0 ? prev : buildFallbackPayments()));
            setLoading(false);
        }, 4000);
        return () => window.clearTimeout(timer);
    }, [loading, buildFallbackPayments]);

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

    const handleUpdateStatus = async (id: string, status: 'paid' | 'pending' | 'overdue', method?: string) => {
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        // Update local state immediately
        setPayments(prev => prev.map(p =>
            p.id === id ? { ...p, status, paymentMethod: method } : p
        ));
        setShowStatusModal(null);

        // Persist to database if not a demo payment
        if (!id.startsWith('demo-')) {
            const updateData: any = { status };
            if (status === 'paid') {
                updateData.paid_date = new Date().toISOString().split('T')[0];
                if (method) updateData.payment_method = method;
            }
            const result = await updatePayment(id, updateData);
            if (result) {
                showToast(`Status de ${payment.clientName} atualizado!`);
            }
        } else {
            showToast(`Status atualizado!`);
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

    return (
        <div
            className="max-w-md mx-auto min-h-screen text-white pb-32"
            style={{ background: 'var(--bg-void)' }}
        >
            {showSuccessToast && (
                <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-slide-down">
                    <div
                        className="px-5 py-3 rounded-2xl flex items-center gap-3"
                        style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)', backdropFilter: 'blur(20px)' }}
                    >
                        <CheckCircle size={16} style={{ color: '#00FF88' }} />
                        <span className="font-black text-xs uppercase tracking-widest text-white">{showSuccessToast}</span>
                    </div>
                </div>
            )}

            {/* AI Header */}
            <PageHeader
                title="Financeiro"
                subtitle="Fluxo de Caixa Elite"
                onBack={onBack}
                accentColor="green"
                rightSlot={
                    <button
                        onClick={handleGenerateReport}
                        className="size-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                        style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.12)' }}
                    >
                        <Download size={15} style={{ color: '#00FF88' }} />
                    </button>
                }
            />

            {loading ? (
                <div className="px-5 space-y-4">
                    <div
                        className="rounded-3xl p-6 flex items-center gap-3 animate-pulse"
                        style={{ background: 'rgba(59, 130, 246,0.06)', border: '1px solid rgba(59, 130, 246,0.12)' }}
                    >
                        <div className="size-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#3D5A80' }}>
                            Carregando Financeiro...
                        </p>
                    </div>
                    <div className="h-44 rounded-3xl animate-pulse" style={{ background: 'rgba(59, 130, 246,0.06)', border: '1px solid rgba(59, 130, 246,0.1)' }} />
                    <PaymentCardSkeleton />
                    <PaymentCardSkeleton />
                    <PaymentCardSkeleton />
                </div>
            ) : payments.length === 0 ? (
                <div className="px-5 py-20 flex flex-col items-center text-center">
                    <div className="size-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.12)' }}>
                        <span className="material-symbols-outlined text-2xl" style={{ color: '#00FF88' }}>receipt_long</span>
                    </div>
                    <p className="font-black text-white mb-1">Nenhuma transação</p>
                    <p className="text-xs" style={{ color: '#3D5A80' }}>Adicione pagamentos para acompanhar o fluxo de caixa.</p>
                </div>
            ) : (
                <>
                    {/* Revenue Hero Card */}
                    <div
                        className="mx-5 relative overflow-hidden rounded-3xl p-6 mb-5"
                        style={{
                            background: 'rgba(0,255,136,0.04)',
                            border: '1px solid rgba(0,255,136,0.12)',
                            boxShadow: '0 0 60px -20px rgba(0,255,136,0.15)',
                        }}
                    >
                        {/* Glow orb */}
                        <div className="absolute -top-10 -right-10 size-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />

                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#00FF88' }}>Receita Confirmada</p>
                            <div className="flex items-end gap-3 mb-1">
                                <h2 className="text-4xl font-black text-white leading-none">
                                    R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
                                </h2>
                                <span
                                    className="mb-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1"
                                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.15)' }}
                                >
                                    <TrendingUp size={10} /> Live
                                </span>
                            </div>

                            {/* Mini stats */}
                            <div className="flex gap-4 mt-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3D5A80' }}>Pendente</p>
                                    <p className="text-sm font-black" style={{ color: '#FFB800' }}>R$ {stats.pending.toLocaleString('pt-BR')}</p>
                                </div>
                                <div
                                    className="w-px"
                                    style={{ background: 'rgba(59, 130, 246,0.08)' }}
                                />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3D5A80' }}>Atrasado</p>
                                    <p className="text-sm font-black" style={{ color: '#FF3366' }}>R$ {stats.overdue.toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div className="h-36 w-full min-w-0 mt-2">
                                {enableHeavyUI ? (
                                    <Suspense fallback={<div className="h-full rounded-2xl animate-pulse" style={{ background: 'rgba(0,255,136,0.04)' }} />}>
                                        <FinanceOverviewChart data={financeData} />
                                    </Suspense>
                                ) : (
                                    <div className="h-full rounded-2xl animate-pulse" style={{ background: 'rgba(0,255,136,0.04)' }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="px-5 flex justify-between items-center mb-3">
                        <h3 className="text-[15px] font-black text-white tracking-tight">Transações</h3>
                    </div>
                    <div className="px-5 mb-5">
                        <div
                            className="flex rounded-2xl p-1 relative"
                            style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.08)' }}
                        >
                            {['overview', 'pending', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                                    style={activeTab === tab
                                        ? { background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)', color: 'white' }
                                        : { color: '#3D5A80' }
                                    }
                                >
                                    {tab === 'overview' ? 'Geral' : tab === 'pending' ? 'Cobranças' : 'Histórico'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Cards */}
                    <div className="px-5 space-y-2.5">
                        {displayPayments.length > 0 ? (
                            displayPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.98] transition-all cursor-pointer"
                                    style={{ background: 'rgba(59, 130, 246,0.03)', border: '1px solid rgba(59, 130, 246,0.06)' }}
                                    onClick={() => setShowPaymentModal(payment)}
                                >
                                    <div className="relative shrink-0">
                                        {payment.clientAvatar ? (
                                            <div className="size-12 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${payment.clientAvatar})`, border: '1px solid rgba(59, 130, 246,0.1)' }} />
                                        ) : (
                                            <div className="size-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246,0.07)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
                                                <span className="material-symbols-outlined text-sm" style={{ color: '#3D5A80' }}>person</span>
                                            </div>
                                        )}
                                        <div
                                            className="absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center"
                                            style={{
                                                background: payment.status === 'paid' ? '#00FF88' : payment.status === 'overdue' ? '#FF3366' : '#FFB800',
                                                border: '2px solid var(--bg-void)',
                                            }}
                                        >
                                            {payment.status === 'paid'
                                                ? <CheckCircle size={8} style={{ color: '#030712' }} />
                                                : payment.status === 'overdue'
                                                    ? <AlertCircle size={8} style={{ color: 'white' }} />
                                                    : <Clock size={8} style={{ color: '#030712' }} />
                                            }
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-white text-sm truncate">{payment.clientName}</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#3D5A80' }}>{payment.plan} • {payment.dueDate}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-black text-white text-sm">R$ {payment.amount}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowStatusModal(payment); }}
                                            className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                            style={{
                                                background: payment.status === 'paid' ? 'rgba(0,255,136,0.1)' : payment.status === 'overdue' ? 'rgba(255,51,102,0.1)' : 'rgba(255,184,0,0.1)',
                                                color: payment.status === 'paid' ? '#00FF88' : payment.status === 'overdue' ? '#FF3366' : '#FFB800',
                                            }}
                                        >
                                            {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState icon="receipt_long" title="Nenhuma transação" description="Cadastre pagamentos dos seus alunos para acompanhar o fluxo de caixa" variant="minimal" />
                        )}
                    </div>
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

            {/* Payment Status Edit Modal */}
            {showStatusModal && (
                <Suspense fallback={null}>
                    <PaymentStatusModal
                        payment={showStatusModal}
                        onClose={() => setShowStatusModal(null)}
                        onUpdateStatus={handleUpdateStatus}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default FinanceView;
