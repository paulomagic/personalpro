import React from 'react';
import type { ThemeMode } from '../../services/ThemeContext';

interface SettingsAppearanceModalProps {
  pendingTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onApply: () => void;
}

const THEME_OPTIONS: Array<{
  key: ThemeMode;
  label: string;
  icon: string;
  desc: string;
}> = [
  { key: 'dark', label: 'Modo Escuro', icon: 'dark_mode', desc: 'Interface escura premium' },
  { key: 'light', label: 'Modo Claro', icon: 'light_mode', desc: 'Interface clara e nítida' },
  { key: 'system', label: 'Automático', icon: 'brightness_auto', desc: 'Segue o sistema' }
];

export default function SettingsAppearanceModal({
  pendingTheme,
  onThemeChange,
  onApply
}: SettingsAppearanceModalProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-pink-400">palette</span>
        </div>
        <h3 className="text-2xl font-black text-white">Aparência</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Personalize seu app</p>
      </div>
      <div className="space-y-3 mb-8">
        {THEME_OPTIONS.map((themeOption) => (
          <div
            key={themeOption.key}
            onClick={() => onThemeChange(themeOption.key)}
            className={`bg-white/5 rounded-2xl p-4 border flex items-center justify-between transition-all cursor-pointer ${pendingTheme === themeOption.key
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-white/5 hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${pendingTheme === themeOption.key ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                <span className="material-symbols-outlined text-sm">{themeOption.icon}</span>
              </div>
              <div>
                <p className="text-sm font-black text-white">{themeOption.label}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {pendingTheme === themeOption.key ? 'Selecionado' : themeOption.desc}
                </p>
              </div>
            </div>
            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${pendingTheme === themeOption.key ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
              {pendingTheme === themeOption.key && <span className="material-symbols-outlined text-white text-sm">check</span>}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onApply}
        className="w-full h-16 bg-blue-600 hover:bg-blue-500 font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow text-white"
      >
        Aplicar Tema
      </button>
    </>
  );
}
