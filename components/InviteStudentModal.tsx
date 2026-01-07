import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, UserPlus, Check, AlertCircle } from 'lucide-react';
import { createInvitation } from '../services/supabaseClient';

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md glass-card rounded-[32px] p-6 border border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                <UserPlus size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">Convidar Aluno</h2>
                                {clientName && (
                                    <p className="text-sm text-slate-400">{clientName}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {success ? (
                        /* Success State */
                        <div className="text-center py-6">
                            <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Convite Criado!</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Copie o link abaixo e envie para o aluno por WhatsApp, email ou como preferir.
                            </p>

                            <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                                <p className="text-xs text-slate-500 mb-2">Link do convite:</p>
                                <p className="text-sm text-blue-400 break-all font-mono">{inviteLink}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    Copiar Link
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
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
                                Envie um convite para seu aluno acessar o app e acompanhar seus treinos, progresso e muito mais.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
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
                                className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Criar Convite
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-slate-500 text-center mt-4">
                                O aluno receberá um link para criar sua conta
                            </p>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InviteStudentModal;
