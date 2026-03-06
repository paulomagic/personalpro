import React from 'react';

interface SettingsHelpModalProps {
  onContactSupport: () => void;
}

const FAQ_ITEMS = [
  'Como criar um novo treino?',
  'Como cadastrar um aluno?',
  'Onde vejo meu faturamento?',
  'Como funciona a IA?',
  'Posso cancelar a qualquer momento?'
];

export default function SettingsHelpModal({ onContactSupport }: SettingsHelpModalProps) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
          <span className="material-symbols-outlined text-3xl text-[#3B82F6]">support_agent</span>
        </div>
        <h3 className="text-2xl font-black text-white">Central de Ajuda</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Como podemos ajudar?</p>
      </div>
      <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {FAQ_ITEMS.map((question) => (
          <div key={question} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer hover:bg-white/10 group">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">{question}</span>
            <span className="material-symbols-outlined text-slate-600 group-hover:text-white">expand_more</span>
          </div>
        ))}
      </div>
      <button onClick={onContactSupport} className="w-full h-16 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_24px_rgba(30,58,138,0.35)]">
        Falar com Suporte Humano
      </button>
    </>
  );
}
