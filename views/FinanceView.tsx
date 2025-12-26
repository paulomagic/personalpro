
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
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-8">
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-slide-down">
                    <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="font-medium">{showSuccessToast}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-14 pb-8 rounded-b-[32px]">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="size-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-white">Financeiro</h1>
                    <button
                        onClick={handleGenerateReport}
                        className="size-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-white">download</span>
                    </button>
                </div>

                {/* Monthly Revenue */}
                <div className="text-center">
                    <p className="text-emerald-100 text-sm font-medium mb-1">Receita de Dezembro</p>
                    <h2 className="text-[48px] font-bold text-white leading-none">
                        R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
                    </h2>
                    <div className="flex items-center justify-center gap-1 mt-2 text-emerald-100">
                        <span className="material-symbols-outlined text-lg">trending_up</span>
                        <span className="text-sm font-medium">+18% vs mês anterior</span>
                    </div>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="px-6 -mt-6">
                <div className="bg-white rounded-[24px] p-4 shadow-lg shadow-slate-200/50 grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{stats.clients}</p>
                        <p className="text-xs text-slate-400">Alunos</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                        <p className="text-2xl font-bold text-amber-500">R$ {stats.pending.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-400">Pendente</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">R$ {stats.overdue.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-400">Atrasado</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mt-6">
                <div className="flex bg-slate-100 rounded-2xl p-1">
                    {(['overview', 'pending', 'history'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            {tab === 'overview' ? 'Visão Geral' : tab === 'pending' ? 'Pendentes' : 'Histórico'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payments List */}
            <div className="px-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                        {activeTab === 'history' ? 'Pagamentos Recebidos' : 'Cobranças Pendentes'}
                    </h3>
                    {activeTab !== 'history' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            {pendingPayments.length}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {displayPayments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                            <p>Tudo em dia!</p>
                        </div>
                    ) : (
                        displayPayments.map((payment) => (
                            <button
                                key={payment.id}
                                onClick={() => setShowPaymentModal(payment)}
                                className="w-full bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-all text-left"
                            >
                                <div
                                    className="size-12 rounded-full bg-cover bg-center border-2 border-white shadow-sm"
                                    style={{ backgroundImage: `url(${payment.clientAvatar})` }}
                                />

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900">{payment.clientName}</h4>
                                    <p className="text-xs text-slate-400">{payment.plan} • Vence {payment.dueDate}</p>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-slate-900">R$ {payment.amount}</p>
                                    <span className={`text-[10px] font-bold uppercase ${payment.status === 'paid' ? 'text-emerald-500' :
                                            payment.status === 'overdue' ? 'text-red-500' : 'text-amber-500'
                                        }`}>
                                        {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 mt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Ações Rápidas</h3>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => pendingPayments[0] && setShowPaymentModal(pendingPayments[0])}
                        className="bg-white rounded-[20px] p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                    >
                        <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">send</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Enviar Cobrança</p>
                    </button>

                    <button
                        onClick={() => pendingPayments[0] && setShowPaymentModal(pendingPayments[0])}
                        className="bg-white rounded-[20px] p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                    >
                        <div className="size-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600">add_circle</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Registrar Pagamento</p>
                    </button>

                    <button
                        onClick={handleGenerateReport}
                        className="bg-white rounded-[20px] p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                    >
                        <div className="size-12 rounded-xl bg-purple-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-600">receipt_long</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Gerar Relatório</p>
                    </button>

                    <button
                        onClick={handleSendMassReminder}
                        className="bg-white rounded-[20px] p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                    >
                        <div className="size-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600">notifications</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Lembrete em Massa</p>
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="w-full max-w-md mx-auto bg-white rounded-t-[32px] p-6 animate-slide-up">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="size-16 rounded-full bg-cover bg-center border-2 border-white shadow-lg"
                                style={{ backgroundImage: `url(${showPaymentModal.clientAvatar})` }}
                            />
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{showPaymentModal.clientName}</h3>
                                <p className="text-slate-400">{showPaymentModal.plan} • R$ {showPaymentModal.amount}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSendReminder(showPaymentModal)}
                                className="w-full h-14 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <span className="material-symbols-outlined">send</span>
                                Enviar Cobrança WhatsApp
                            </button>

                            {showPaymentModal.status !== 'paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(showPaymentModal)}
                                    className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                                >
                                    <span className="material-symbols-outlined">check</span>
                                    Marcar como Pago
                                </button>
                            )}

                            <button
                                onClick={() => setShowPaymentModal(null)}
                                className="w-full h-14 bg-slate-100 text-slate-700 font-bold rounded-2xl active:scale-[0.98] transition-transform"
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
