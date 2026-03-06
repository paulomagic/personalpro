import React from 'react';
import { Edit3 } from 'lucide-react';

interface SettingsProfileCardProps {
  coachAvatar: string;
  coachName: string;
  isDemo: boolean;
  onEdit: () => void;
}

export default function SettingsProfileCard({
  coachAvatar,
  coachName,
  isDemo,
  onEdit
}: SettingsProfileCardProps) {
  return (
    <div className="px-5 mb-6">
      <div className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4 bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 size-32 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-[20px]" />

        <img
          className="size-16 rounded-2xl shrink-0 object-cover border-[1.5px] border-[rgba(59,130,246,0.15)]"
          src={coachAvatar}
          alt={coachName}
        />
        <div className="flex-1 relative z-10">
          <h2 className="text-lg font-black text-white leading-tight">{coachName}</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1 text-[#B8D3FF]">
            {isDemo ? 'Modo Demonstração' : 'Personal Trainer Elite'}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="size-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]"
          aria-label="Editar perfil"
        >
          <Edit3 size={15} className="text-[#3B82F6]" />
        </button>
      </div>
    </div>
  );
}
