import React from 'react';

interface SettingsProfileModalProps {
  coachAvatar: string;
  coachName: string;
  profileName: string;
  coachEmail: string;
  saving: boolean;
  onProfileNameChange: (value: string) => void;
  onSave: () => void;
}

export default function SettingsProfileModal({
  coachAvatar,
  coachName,
  profileName,
  coachEmail,
  saving,
  onProfileNameChange,
  onSave
}: SettingsProfileModalProps) {
  const profileNameId = 'settings-profile-name';
  const profileEmailId = 'settings-profile-email';

  return (
    <>
      <div className="text-center mb-8">
        <img className="size-24 mx-auto rounded-[30px] object-cover border-4 border-slate-950 shadow-glow mb-4" src={coachAvatar} alt={coachName} />
        <h3 className="text-2xl font-black text-white">Editar Perfil</h3>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-2">Atualize suas informações</p>
      </div>
      <div className="space-y-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3 focus-within:border-blue-500/50 transition-colors">
          <span className="material-symbols-outlined text-slate-500">person</span>
          <div className="flex-1">
            <p id={`${profileNameId}-label`} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nome</p>
            <input
              id={profileNameId}
              type="text"
              value={profileName}
              onChange={(event) => onProfileNameChange(event.target.value)}
              aria-labelledby={`${profileNameId}-label`}
              className="bg-transparent text-sm font-black text-white w-full outline-none"
            />
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3 focus-within:border-blue-500/50 transition-colors">
          <span className="material-symbols-outlined text-slate-300">mail</span>
          <div className="flex-1">
            <p id={`${profileEmailId}-label`} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Email</p>
            <input
              id={profileEmailId}
              type="email"
              defaultValue={coachEmail}
              disabled
              aria-labelledby={`${profileEmailId}-label`}
              className="bg-transparent text-sm font-black text-slate-400 w-full outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full h-16 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow flex items-center justify-center gap-2"
      >
        {saving ? (
          <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Salvar Alterações'
        )}
      </button>
    </>
  );
}
