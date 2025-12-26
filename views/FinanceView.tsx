
import React, { useState } from 'react';

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

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-slide-down">
                    <div className="glass-card bg-emerald-500/10 border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl shadow-glow flex items-center gap-3">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="font-black text-xs uppercase tracking-widest">{showSuccessToast}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 pt-14 pb-8 animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-white tracking-tight">Financeiro</h1>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Protocolo de Caixa</p>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-95 transition-all text-blue-400"
                    >
                        <span className="material-symbols-outlined">download</span>
                    </button>
                </div>

                {/* Monthly Revenue Card */}
                <div className="glass-card rounded-[40px] p-8 text-center shadow-glow relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Receita Acumulada</p>
                    <h2 className="text-5xl font-black text-white leading-none tracking-tighter mb-4 tabular-nums">
                        R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
                    </h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">+18.5% este mês</span>
                    </div>
                </div>
            </header>

            <main className="px-6 space-y-8">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 animate-slide-up">
                    <div className="glass-card rounded-[28px] p-5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendentes</p>
                        <p className="text-xl font-black text-white tabular-nums">R$ {stats.pending.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="glass-card rounded-[28px] p-5">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Atrasados</p>
                        <p className="text-xl font-black text-red-400 tabular-nums">R$ {stats.overdue.toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="animate-slide-up stagger-1">
                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {(['overview', 'pending', 'history'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab === 'overview' ? 'Geral' : tab === 'pending' ? 'Pendentes' : 'Histórico'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payments List */}
                <div className="animate-slide-up stagger-2">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {activeTab === 'history' ? 'Transações Realizadas' : 'Fluxo de Recebíveis'}
                        </h3>
                        {activeTab !== 'history' && (
                            <span className="size-5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black flex items-center justify-center">
                                {pendingPayments.length}
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {displayPayments.length === 0 ? (
                            <div className="glass-card rounded-[32px] py-12 text-center text-slate-500">
                                <span className="material-symbols-outlined text-3xl mb-2 opacity-20">verified</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Tudo em conformidade</p>
                            </div>
                        ) : (
                            displayPayments.map((payment) => (
                                <button
                                    key={payment.id}
                                    onClick={() => setShowPaymentModal(payment)}
                                    className="w-full glass-card rounded-[28px] p-4 flex items-center gap-4 active:scale-[0.99] transition-all group"
                                >
                                    <div
                                        className="size-12 rounded-2xl bg-cover bg-center border-2 border-white/10 group-hover:border-blue-500/30 transition-colors"
                                        style={{ backgroundImage: `url(${payment.clientAvatar})` }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-white text-sm leading-tight mb-0.5 truncate">{payment.clientName}</h4>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{payment.plan} • Venc {payment.dueDate}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-black text-white text-sm tabular-nums">R$ {payment.amount}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${payment.status === 'paid' ? 'text-emerald-400' :
                                            payment.status === 'overdue' ? 'text-red-400' : 'text-amber-400'
                                            }`}>
                                            {payment.status === 'paid' ? 'PAGO' : payment.status === 'overdue' ? 'ATRASO' : 'PENDENTE'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="animate-slide-up stagger-3 pb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Ações de Gestão</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => pendingPayments[0] && setShowPaymentModal(pendingPayments[0])}
                            className="glass-card rounded-[28px] p-5 flex flex-col items-center gap-4 active:scale-[0.98] transition-all hover:border-blue-500/30"
                        >
                            <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-400">send</span>
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Cobrar</p>
                        </button>

                        <button
                            onClick={() => pendingPayments[0] && setShowPaymentModal(pendingPayments[0])}
                            className="glass-card rounded-[28px] p-5 flex flex-col items-center gap-4 active:scale-[0.98] transition-all hover:border-emerald-500/30"
                        >
                            <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-400">add_circle</span>
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Registrar</p>
                        </button>
                    </div>
                </div>
            </main>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-10 animate-slide-up border-t border-white/10">
                        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-10"></div>

                        <div className="flex items-center gap-5 mb-10">
                            <div
                                className="size-20 rounded-3xl bg-cover bg-center border-2 border-white/10 shadow-glow"
                                style={{ backgroundImage: `url(${showPaymentModal.clientAvatar})` }}
                            />
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{showPaymentModal.clientName}</h3>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">{showPaymentModal.plan} • R$ {showPaymentModal.amount}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSendReminder(showPaymentModal)}
                                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                            >
                                <span className="material-symbols-outlined">send</span>
                                Cobrança WhatsApp
                            </button>

                            {showPaymentModal.status !== 'paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(showPaymentModal)}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20"
                                >
                                    <span className="material-symbols-outlined">check</span>
                                    Validar Pagamento
                                </button>
                            )}

                            <button
                                onClick={() => setShowPaymentModal(null)}
                                className="w-full h-14 bg-white/5 text-slate-500 font-bold rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceView;
