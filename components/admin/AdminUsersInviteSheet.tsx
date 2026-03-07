import React from 'react';
import { BottomSheet } from '../BottomSheet';

interface AdminUsersInviteSheetProps {
    isOpen: boolean;
    name: string;
    email: string;
    error: string | null;
    submitting: boolean;
    onClose: () => void;
    onNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onSubmit: () => void;
}

export function AdminUsersInviteSheet({
    isOpen,
    name,
    email,
    error,
    submitting,
    onClose,
    onNameChange,
    onEmailChange,
    onSubmit
}: AdminUsersInviteSheetProps) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Convidar Coach">
            <div className="space-y-4">
                <p className="text-sm text-slate-400">
                    Envia um convite real por e-mail para criação de conta de personal trainer.
                </p>

                <div className="space-y-2">
                    <label htmlFor="invite-coach-name" className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Nome
                    </label>
                    <input
                        id="invite-coach-name"
                        type="text"
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60"
                        placeholder="Nome do personal trainer"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="invite-coach-email" className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Email
                    </label>
                    <input
                        id="invite-coach-email"
                        type="email"
                        value={email}
                        onChange={(event) => onEmailChange(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60"
                        placeholder="coach@empresa.com"
                    />
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="flex-1 rounded-xl bg-blue-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Enviando...' : 'Enviar convite'}
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}
