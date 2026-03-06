import React from 'react';

interface SettingsSecurityModalProps {
  newPassword: string;
  confirmPassword: string;
  securitySaving: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSave: () => void;
}

export default function SettingsSecurityModal({
  newPassword,
  confirmPassword,
  securitySaving,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSave
}: SettingsSecurityModalProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-400">security</span>
        </div>
        <h3 className="text-2xl font-black text-white">Segurança</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Proteja sua conta</p>
      </div>
      <div className="space-y-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Nova Senha</p>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-400">key</span>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(event) => onNewPasswordChange(event.target.value)}
              className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmar Nova Senha</p>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400">password</span>
            <input
              type="password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
              className="bg-transparent text-white font-bold w-full outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
          <span className="text-xs font-bold text-slate-400">Autenticação em 2 Etapas (2FA)</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Em breve</span>
        </div>
      </div>
      <button onClick={onSave} disabled={securitySaving} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]">
        {securitySaving ? 'Atualizando...' : 'Atualizar Senha'}
      </button>
    </>
  );
}
