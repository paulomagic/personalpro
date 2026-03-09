import React from 'react';

interface SettingsHelpModalProps {
  onContactSupport: () => void;
  supportCtaLabel: string;
  hasDirectSupportEmail?: boolean;
}

const FAQ_ITEMS = [
  {
    question: 'Como criar um novo treino?',
    answer: [
      '1. Abra a tela inicial e toque em "Gerar Treino com IA" para usar o AI Builder, ou entre no perfil do aluno e abra o builder manual.',
      '2. Escolha o aluno, defina o objetivo e a frequência semanal.',
      '3. Revise os exercícios sugeridos ou monte o treino manualmente.',
      '4. Toque em "Salvar" para vincular o treino ao aluno.'
    ]
  },
  {
    question: 'Como cadastrar um aluno?',
    answer: [
      '1. Abra a tela "Alunos".',
      '2. Toque no botão para adicionar um novo aluno.',
      '3. Preencha nome, contato e os dados básicos.',
      '4. Depois abra o perfil do aluno para completar medidas, objetivo e observações.'
    ]
  },
  {
    question: 'Onde vejo meu faturamento?',
    answer: [
      'Abra a tela "Financeiro" para ver pagamentos pagos, pendentes e atrasados.',
      'Na tela inicial, o dashboard também mostra um resumo rápido da receita confirmada.'
    ]
  },
  {
    question: 'Como funciona a IA?',
    answer: [
      'A IA usa objetivo, nível, frequência e histórico do aluno para montar a sugestão.',
      'Antes de salvar, o app valida a estrutura do treino.',
      'Se a geração automática falhar, o sistema usa um fallback seguro para não quebrar o fluxo.'
    ]
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: [
      'Controles de dados e solicitações LGPD ficam em "Configurações → Privacidade e Dados".',
      'Cancelamento comercial e plano dependem do canal operacional configurado no seu negócio.'
    ]
  }
] as const;

export default function SettingsHelpModal({
  onContactSupport,
  supportCtaLabel,
  hasDirectSupportEmail = false
}: SettingsHelpModalProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="text-center mb-8">
        <div className="size-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
          <span className="material-symbols-outlined text-3xl text-[#3B82F6]">support_agent</span>
        </div>
        <h3 className="text-2xl font-black text-white">Central de Ajuda</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Como podemos ajudar?</p>
      </div>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {FAQ_ITEMS.map((item, index) => (
          <div
            key={item.question}
            className="w-full bg-white/5 rounded-2xl border border-white/5 text-left"
          >
            <button
              type="button"
              onClick={() => setOpenIndex((current) => current === index ? null : index)}
              className="w-full flex items-center justify-between gap-3 p-4 active:scale-[0.99] transition-all hover:bg-white/10 group rounded-2xl"
              aria-expanded={openIndex === index}
            >
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">{item.question}</span>
              <span className={`material-symbols-outlined transition-transform ${openIndex === index ? 'rotate-180 text-white' : 'text-slate-600 group-hover:text-white'}`}>expand_more</span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 -mt-1 space-y-3">
                {item.answer.map((line) => (
                  <p key={line} className="text-sm leading-6 text-slate-300">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 pb-2">
        <p className="mb-3 text-center text-xs leading-5 text-slate-400">
          {hasDirectSupportEmail
            ? 'Esse botão abre o canal de suporte configurado no app.'
            : 'Esse botão copia nome do app, data, conta, tema, status do push e navegador resumido para você colar no atendimento.'}
        </p>
        <button onClick={onContactSupport} className="w-full h-16 text-white font-black rounded-3xl active:scale-[0.98] transition-all uppercase tracking-widest bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_24px_rgba(30,58,138,0.35)]">
          {supportCtaLabel}
        </button>
      </div>
    </div>
  );
}
