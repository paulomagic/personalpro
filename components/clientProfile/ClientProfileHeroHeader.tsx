import React from 'react';
import { ArrowLeft, Camera, Pause, AlertTriangle, TrendingUp, Settings, UserPlus, X } from 'lucide-react';
import { Client } from '../../types';

interface ClientProfileHeroHeaderProps {
  client: Client;
  coachId?: string;
  isUploadingAvatar: boolean;
  onBack: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInviteStudent: () => void;
  onOpenStatusModal: () => void;
}

function getStatusColor(status: Client['status']) {
  const colors = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'at-risk': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    paused: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    inactive: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return colors[status] || colors.inactive;
}

function getStatusIcon(status: Client['status']) {
  const icons = {
    active: TrendingUp,
    'at-risk': AlertTriangle,
    paused: Pause,
    inactive: X
  };
  return icons[status] || X;
}

function getStatusLabel(status: Client['status']) {
  if (status === 'active') return 'Ativo';
  if (status === 'paused') return 'Pausado';
  if (status === 'at-risk') return 'Risco';
  return 'Inativo';
}

function getSuspensionReasonLabel(reason?: Client['suspensionReason']) {
  if (reason === 'travel') return 'Viagem';
  if (reason === 'sick') return 'Doença';
  if (reason === 'financial') return 'Financeiro';
  return 'Outro';
}

const ClientProfileHeroHeader: React.FC<ClientProfileHeroHeaderProps> = ({
  client,
  coachId,
  isUploadingAvatar,
  onBack,
  onAvatarChange,
  onInviteStudent,
  onOpenStatusModal
}) => {
  const StatusIcon = getStatusIcon(client.status);

  return (
    <header className="relative h-72 w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={client.avatar_url || client.avatar || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600&fit=crop'}
          className="w-full h-full object-cover scale-110 blur-[2px] opacity-60"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
      </div>

      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-10">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {coachId && (
            <label
              className={`size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/20'}`}
              title="Trocar Foto"
            >
              {isUploadingAvatar ? (
                <div className="size-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={18} />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
                disabled={isUploadingAvatar}
              />
            </label>
          )}

          {coachId && (
            <button
              onClick={onInviteStudent}
              className="size-10 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
              title="Convidar Aluno"
            >
              <UserPlus size={18} />
            </button>
          )}
          <button
            onClick={onOpenStatusModal}
            className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-6 z-10 flex items-end gap-4">
        <div className="flex-shrink-0 relative">
          <div className="size-[76px] rounded-2xl border-[3px] border-white/20 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)]">
              <span className="text-2xl font-black text-white">{client.name.charAt(0)}</span>
            </div>
            {(client.avatar_url || client.avatar) && (
              <img
                key={client.avatar_url || client.avatar}
                src={client.avatar_url || client.avatar}
                alt={client.name}
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <h1 className="text-white text-[22px] font-bold leading-tight truncate">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-white/80 text-sm font-medium truncate max-w-[120px]">{client.goal}</p>
            <span className="text-white/40">•</span>
            <span className="text-white/70 text-xs">{client.level}</span>
            <span className="text-white/40">•</span>

            <button
              onClick={onOpenStatusModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-colors ${getStatusColor(client.status)}`}
            >
              <StatusIcon size={12} />
              <span className="text-xs font-bold uppercase">
                {getStatusLabel(client.status)}
              </span>
            </button>
          </div>
          {client.suspensionReason && client.status === 'paused' && (
            <p className="text-xs text-slate-400 mt-1">
              ⏸️ Pausado por: {getSuspensionReasonLabel(client.suspensionReason)}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default ClientProfileHeroHeader;
