import React, { useState } from 'react';
import { Mail, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { createInvitation } from '../services/supabase/domains/invitationsDomain';

interface InviteStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    coachId: string;
    clientId?: string;
    clientName?: string;
    clientEmail?: string;
}

const InviteStudentModal: React.FC<InviteStudentModalProps> = ({
    isOpen,
    onClose,
    coachId,
    clientId,
    clientName,
    clientEmail
}) => {
    const [email, setEmail] = useState(clientEmail || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Digite o email do aluno');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email inválido');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const invitation = await createInvitation(coachId, email, clientId);

            if (invitation) {
                const link = `${window.location.origin}?invite=${invitation.token}`;
                setInviteLink(link);
                setSuccess(true);
            } else {
                setError('Erro ao criar convite. Tente novamente.');
            }
        } catch (err) {
            setError('Erro ao criar convite. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
        }
    };

    const shareViaWhatsApp = () => {
        if (!inviteLink) return;

        const message = encodeURIComponent(
            `Acesse seu convite do Personal PRO por este link:\n${inviteLink}`
        );

        window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
    };

    const handleClose = () => {
        setEmail(clientEmail || '');
        setLoading(false);
        setSuccess(false);
        setError(null);
        setInviteLink(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md glass-card rounded-[32px] p-6 border border-white/10 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={handleClose}
                            className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
                        >
                            <span>←</span> Voltar
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-1">Convidar Aluno</h2>
                        {clientName && (
                            <p className="text-sm text-gray-400">{clientName}</p>
                        )}
                    </div>

                    {success ? (
                        /* Success State */
                        <div className="text-center py-6">
                            <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Convite Criado!</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Copie o link abaixo ou envie direto por WhatsApp. Nenhum email é disparado automaticamente.
                            </p>

                            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                                <p className="text-xs text-slate-500 mb-2">Link do convite:</p>
                                <p className="text-sm text-blue-400 break-all font-mono">{inviteLink}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    Copiar Link
                                </button>
                                <button
                                    onClick={shareViaWhatsApp}
                                    className="py-3 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 mt-4">
                                O convite expira em 7 dias
                            </p>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleSubmit}>
                            <p className="text-sm text-slate-400 mb-6">
                                Gere um link de convite para copiar e enviar manualmente ao aluno, de preferência por WhatsApp.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
                                    Email do Aluno
                                </label>
                                <div className="relative">
                                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="aluno@email.com"
                                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                ) : (
                                    'CRIAR CONVITE'
                                )}
                            </button>

                            <p className="text-xs text-slate-500 text-center mt-4">
                                Vamos gerar um link manual. Nenhum email é enviado automaticamente.
                            </p>
                        </form>
                    )}
            </div>
        </div>
    );
};

export default InviteStudentModal;
