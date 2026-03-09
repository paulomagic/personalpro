import React from 'react';

interface SettingsToastProps {
  message: string | null;
  type: 'success' | 'error';
}

export default function SettingsToast({ message, type }: SettingsToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-6 left-4 right-4 z-[80] animate-slide-down sm:left-1/2 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-sm sm:-translate-x-1/2">
      <div
        className={`w-full px-4 py-3 rounded-3xl flex items-start gap-3 backdrop-blur-xl border ${type === 'error'
          ? 'bg-[rgba(255,51,102,0.15)] border-[rgba(255,51,102,0.25)]'
          : 'bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.2)]'
          }`}
        role="status"
        aria-live="polite"
      >
        <div className={`mt-0.5 size-4 shrink-0 rounded-full ${type === 'error' ? 'bg-[#FF3366]' : 'bg-[#3B82F6]'}`} />
        <span className="min-w-0 break-words text-[11px] font-black uppercase tracking-wide text-white">
          {message}
        </span>
      </div>
    </div>
  );
}
