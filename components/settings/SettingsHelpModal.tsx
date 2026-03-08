import React from 'react';

interface SettingsHelpModalProps {
  onContactSupport: () => void;
  supportCtaLabel: string;
}

const FAQ_ITEMS = [
  {
    question: 'Como criar um novo treino?',
    answer: 'Use o AI Builder para gerar uma sugestão assistida por IA ou abra o Builder tradicional para montar o treino manualmente. Depois salve o treino para vinculá-lo ao aluno.'
  },
  {
    question: 'Como cadastrar um aluno?',
    answer: 'Abra a tela de Alunos, toque em adicionar e preencha os dados básicos. Depois você pode completar perfil físico, observações clínicas e objetivos no perfil do aluno.'
  },
  {
    question: 'Onde vejo meu faturamento?',
    answer: 'A tela Financeiro mostra pagamentos pagos, pendentes e atrasados. O dashboard principal também resume a receita confirmada do período.'
  },
  {
    question: 'Como funciona a IA?',
    answer: 'A IA usa objetivo, nível, frequência, feedbacks e sinais adaptativos para propor treinos. Quando necessário, o app aplica fallback determinístico e validação por schema antes de salvar.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Solicitações LGPD e controles de dados já ficam em Configurações → Privacidade e Dados. Questões comerciais e cancelamento de plano dependem do canal operacional do seu negócio.'
  }
] as const;

export default function SettingsHelpModal({ onContactSupport, supportCtaLabel }: SettingsHelpModalProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

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
        {FAQ_ITEMS.map((item, index) => (
          <button
            key={item.question}
            type="button"
            onClick={() => setOpenIndex((current) => current === index ? null : index)}
            className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 active:scale-[0.99] transition-all text-left hover:bg-white/10 group"
            aria-expanded={openIndex === index}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">{item.question}</span>
              <span className={`material-symbols-outlined transition-transform ${openIndex === index ? 'rotate-180 text-white' : 'text-slate-600 group-hover:text-white'}`}>expand_more</span>
            </div>
            {openIndex === index && (
              <p className="mt-3 text-xs leading-6 text-slate-400">
                {item.answer}
              </p>
            )}
          </button>
        ))}
      </div>
      <button onClick={onContactSupport} className="w-full h-16 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_24px_rgba(30,58,138,0.35)]">
        {supportCtaLabel}
      </button>
    </>
  );
}
