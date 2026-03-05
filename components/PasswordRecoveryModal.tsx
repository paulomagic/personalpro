import React from 'react';

interface PasswordRecoveryModalProps {
    show: boolean;
    description: string;
    newPassword: string;
    recoveryError: string | null;
    isUpdatingPassword: boolean;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
    show,
    description,
    newPassword,
    recoveryError,
    isUpdatingPassword,
    onPasswordChange,
    onSubmit
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
                <h2 className="text-xl font-black text-white mb-2 text-center">Definir Nova Senha</h2>
                <p className="text-sm text-slate-400 text-center mb-6">{description}</p>

                {recoveryError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-xs text-center font-medium">{recoveryError}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <input
                        type="password"
                        placeholder="Sua nova senha"
                        value={newPassword}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 outline-none transition-all font-medium"
                    />
                    <button
                        onClick={onSubmit}
                        disabled={isUpdatingPassword}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isUpdatingPassword ? 'Salvando...' : 'Salvar Senha'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordRecoveryModal;
