import React from 'react';
import type { NotificationPrefs } from '../../services/pushNotifications';

interface SettingsNotificationsModalProps {
  isPushAvailable: boolean;
  notifState: NotificationPrefs;
  sendingTestPush: boolean;
  isDemo: boolean;
  onToggle: (key: keyof NotificationPrefs) => void;
  onSendTestPush: () => void;
  onSave: () => void;
}

const NOTIFICATION_ITEMS: Array<{
  key: keyof NotificationPrefs;
  label: string;
  sub: string;
  requiresPushSupport?: boolean;
}> = [
  { key: 'push', label: 'Push Notifications', sub: 'Alertas no celular', requiresPushSupport: true },
  { key: 'email', label: 'Emails', sub: 'Resumos e relatórios' },
  { key: 'sms', label: 'SMS', sub: 'Avisos urgentes' },
  { key: 'promo', label: 'Marketing', sub: 'Novidades e ofertas' }
];

export default function SettingsNotificationsModal({
  isPushAvailable,
  notifState,
  sendingTestPush,
  isDemo,
  onToggle,
  onSendTestPush,
  onSave
}: SettingsNotificationsModalProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-blue-400">notifications_active</span>
        </div>
        <h3 className="text-2xl font-black text-white">Notificações</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Controle seus alertas</p>
      </div>
      <div className="space-y-3 mb-8">
        {NOTIFICATION_ITEMS.map((item) => {
          const comingSoon = item.requiresPushSupport ? !isPushAvailable : false;
          const active = notifState[item.key];
          const descriptionId = `settings-notification-${item.key}-description`;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggle(item.key)}
              disabled={comingSoon}
              aria-pressed={comingSoon ? undefined : active}
              aria-describedby={descriptionId}
              className={`w-full bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:hover:bg-white/5 ${comingSoon ? 'opacity-80' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${comingSoon ? 'bg-slate-800 text-slate-500' : active ? 'bg-blue-500 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">{comingSoon ? 'schedule' : active ? 'check' : 'close'}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{item.label}</p>
                  <p id={descriptionId} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {comingSoon ? `${item.key === 'push' ? 'Indisponível neste navegador' : item.sub} • Em breve` : item.sub}
                  </p>
                </div>
              </div>
              <span aria-hidden="true" className={`w-12 h-7 rounded-full relative transition-colors ${comingSoon ? 'bg-slate-700' : active ? 'bg-blue-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all ${comingSoon ? 'left-1' : active ? 'left-6' : 'left-1'}`} />
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onSendTestPush}
        disabled={!notifState.push || sendingTestPush || isDemo}
        className="w-full h-12 mb-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.18)] text-[#93C5FD]"
      >
        {sendingTestPush ? 'Enviando push...' : 'Enviar Push de Teste'}
      </button>
      <button onClick={onSave} className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest shadow-glow">
        Confirmar Preferências
      </button>
    </>
  );
}
