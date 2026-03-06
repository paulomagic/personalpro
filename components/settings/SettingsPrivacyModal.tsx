import React from 'react';
import { Download } from 'lucide-react';

interface SettingsPrivacyModalProps {
  onExport: () => void;
  onRequestDelete: () => void;
  onRequestAccess: () => void;
}

export default function SettingsPrivacyModal({
  onExport,
  onRequestDelete,
  onRequestAccess
}: SettingsPrivacyModalProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-teal-300">privacy_tip</span>
        </div>
        <h3 className="text-2xl font-black text-white">Privacidade e Dados</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">LGPD operacional</p>
      </div>

      <div className="space-y-3 mb-8">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Proteções ativas</p>
          <p className="mt-2 text-sm font-bold text-white">Prompts de IA mascarados e dados clínicos protegidos no backend.</p>
          <p className="mt-1 text-xs text-slate-400">Fluxos sensíveis usam redaction, categorização e camada de criptografia clínica.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Seus direitos</p>
          <p className="mt-2 text-sm text-slate-300">Acesso, correção, exportação e exclusão dependem de processo operacional e backend do produto.</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onExport}
          className="w-full h-14 rounded-2xl border border-[rgba(45,212,191,0.2)] bg-[rgba(20,184,166,0.08)] text-sm font-black uppercase tracking-widest text-teal-200"
        >
          <span className="inline-flex items-center gap-2">
            <Download size={15} />
            Exportar Dados LGPD
          </span>
        </button>
        <button
          onClick={onRequestDelete}
          className="w-full h-14 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(239,68,68,0.08)] text-sm font-black uppercase tracking-widest text-red-200"
        >
          Solicitar Exclusão
        </button>
        <button
          onClick={onRequestAccess}
          className="w-full h-14 rounded-2xl border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.08)] text-sm font-black uppercase tracking-widest text-blue-200"
        >
          Solicitar Atendimento LGPD
        </button>
        <a
          href="/privacy-policy.html"
          target="_blank"
          rel="noreferrer"
          className="flex h-14 items-center justify-center rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.08)] text-sm font-black uppercase tracking-widest text-blue-200"
        >
          Abrir Política de Privacidade
        </a>
      </div>
    </>
  );
}
