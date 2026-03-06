import React, { useEffect, useState } from 'react';

export default function ConnectivityBanner() {
  const [online, setOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);

    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);

    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[70] border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-100 backdrop-blur"
    >
      Sem internet. Recursos online, login e IA ficam indisponiveis ate a conexao voltar.
    </div>
  );
}
