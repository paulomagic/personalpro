import React from 'react';

interface SettingsToastProps {
  message: string | null;
  type: 'success' | 'error';
}

export default function SettingsToast({ message, type }: SettingsToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-max max-w-[90%]">
      <div
        className={`px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-xl border ${type === 'error'
          ? 'bg-[rgba(255,51,102,0.15)] border-[rgba(255,51,102,0.25)]'
          : 'bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.2)]'
          }`}
        role="status"
        aria-live="polite"
      >
        <div className={`size-4 rounded-full ${type === 'error' ? 'bg-[#FF3366]' : 'bg-[#3B82F6]'}`} />
        <span className="text-[11px] font-black uppercase tracking-widest text-white">{message}</span>
      </div>
    </div>
  );
}
