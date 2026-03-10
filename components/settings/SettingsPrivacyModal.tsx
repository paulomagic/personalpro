import React from 'react';
import { Download } from 'lucide-react';
import type { PrivacyConsentSummary, PrivacyDeleteReadinessSummary, PrivacyRequestSummary } from '../../services/privacyService';

interface SettingsPrivacyModalProps {
  onExport: () => void;
  onRequestDelete: (notes?: string) => void;
  onRequestAccess: () => void;
  onRequestRectify: () => void;
  onCancelRequest: (requestId: string) => void;
  onConsentChange: (consentType: 'privacy_policy' | 'ai_data_processing' | 'clinical_data_processing', granted: boolean) => void;
  requests: PrivacyRequestSummary[];
  consents: PrivacyConsentSummary[];
  deleteReadiness: PrivacyDeleteReadinessSummary | null;
  loadingRequests: boolean;
  savingConsent: string | null;
}

export default function SettingsPrivacyModal({
  onExport,
  onRequestDelete,
  onRequestAccess,
  onRequestRectify,
  onCancelRequest,
  onConsentChange,
  requests,
  consents,
  deleteReadiness,
  loadingRequests,
  savingConsent
}: SettingsPrivacyModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [deleteNotes, setDeleteNotes] = React.useState('');

  const consentMap = new Map(consents.map((consent) => [consent.consent_type, consent]));
  const openDeleteRequest = requests.find((request) => request.request_type === 'delete' && (request.status === 'open' || request.status === 'in_review'));
  const canSubmitDeleteRequest = deleteConfirmation.trim().toUpperCase() === 'EXCLUIR' && !openDeleteRequest;
  const consentItems = [
    {
      key: 'privacy_policy' as const,
      label: 'Política de privacidade',
      description: 'Registra o aceite da política vigente e da base legal operacional do app.'
    },
    {
      key: 'ai_data_processing' as const,
      label: 'IA para personalização',
      description: 'Autoriza o uso de dados reduzidos e mascarados para geração assistida de treinos.'
    },
    {
      key: 'clinical_data_processing' as const,
      label: 'Dados clínicos sensíveis',
      description: 'Registra ciência sobre tratamento reforçado de observações e restrições clínicas.'
    }
  ];

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
          <p className="mt-2 text-sm text-slate-300">Acesso, correção, exportação e exclusão já passam por trilha auditável no backend e histórico visível no app.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Inventário de dados</p>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            <p>Conta e autenticação: email, perfil, preferências e sessão.</p>
            <p>Operação: agenda, treinos, pagamentos, convites, push e logs.</p>
            <p>Clínico: observações, lesões, medidas e sinais relevantes de treino.</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Consentimentos registrados</p>
            <p className="mt-1 text-xs text-slate-400">Aceites e revogações ficam versionados e auditáveis no backend.</p>
          </div>
          {loadingRequests && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Atualizando</span>}
        </div>

        <div className="mt-4 space-y-3">
          {consentItems.map((item) => {
            const consent = consentMap.get(item.key);
            const granted = Boolean(consent?.granted);
            const busy = savingConsent === item.key;

            return (
              <div key={item.key} className="rounded-2xl border border-white/5 bg-[rgba(15,23,42,0.5)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {consent?.version ? `versão ${consent.version}` : 'sem registro'}
                      {consent?.updated_at ? ` • ${new Date(consent.updated_at).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${granted
                    ? 'bg-[rgba(16,185,129,0.15)] text-emerald-200'
                    : 'bg-[rgba(239,68,68,0.12)] text-red-200'}`}
                  >
                    {granted ? 'ativo' : 'revogado'}
                  </span>
                </div>

                <button
                  onClick={() => onConsentChange(item.key, !granted)}
                  disabled={busy}
                  className={`mt-3 h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 ${granted
                    ? 'border border-[rgba(248,113,113,0.2)] bg-[rgba(239,68,68,0.08)] text-red-200'
                    : 'border border-[rgba(45,212,191,0.2)] bg-[rgba(20,184,166,0.08)] text-teal-200'}`}
                >
                  {busy ? 'Salvando...' : granted ? 'Revogar Consentimento' : 'Registrar Consentimento'}
                </button>
              </div>
            );
          })}
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
        <div className="rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(239,68,68,0.08)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-red-200">Solicitar Exclusão</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Use esta opção para abrir o processo de exclusão da sua conta e dos dados associados.
                Antes de confirmar, exporte seus dados se quiser guardar um arquivo local.
              </p>
              {openDeleteRequest && (
                <p className="mt-2 text-xs font-bold text-amber-200">
                  Já existe uma solicitação de exclusão em andamento.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowDeleteConfirm((current) => !current)}
              className="rounded-xl border border-[rgba(248,113,113,0.2)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-200"
            >
              {showDeleteConfirm ? 'Fechar' : 'Revisar'}
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/5 bg-[rgba(15,23,42,0.45)] p-4">
              <div className="space-y-2 text-xs text-slate-300">
                <p>1. Exporte seus dados antes de seguir, se quiser manter uma cópia.</p>
                <p>2. O pedido entra no histórico LGPD com trilha auditável.</p>
                <p>3. Quando aprovado, o backend executa anonimização e limpeza dos dados de aplicação vinculados à sua conta.</p>
              </div>

              {deleteReadiness && (
                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Escopo estimado da exclusão
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <p>Perfil: {deleteReadiness.profile_exists ? '1 conta' : '0'}</p>
                    <p>Alunos: {deleteReadiness.clients_count}</p>
                    <p>Agenda: {deleteReadiness.appointments_count}</p>
                    <p>Pagamentos: {deleteReadiness.payments_count}</p>
                    <p>Push: {deleteReadiness.push_subscriptions_count}</p>
                    <p>Logs IA: {deleteReadiness.ai_logs_count}</p>
                    <p>Logs app: {deleteReadiness.activity_logs_count}</p>
                    <p>Consentimentos: {deleteReadiness.privacy_consents_count}</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    O processamento atual remove ou anonimiza dados da aplicação. A exclusão da credencial de autenticação depende da esteira administrativa do ambiente.
                  </p>
                </div>
              )}

              {!deleteReadiness && (
                <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Escopo estimado da exclusão
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    O app ainda não conseguiu carregar a estimativa de dados afetados. Você pode fechar e abrir novamente este painel antes de confirmar.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Observação opcional
                </label>
                <textarea
                  value={deleteNotes}
                  onChange={(event) => setDeleteNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Ex: quero encerrar a conta e remover meus dados operacionais."
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Digite EXCLUIR para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm font-bold uppercase tracking-widest text-white outline-none placeholder:text-slate-600"
                  placeholder="EXCLUIR"
                />
              </div>

              <button
                onClick={() => {
                  onRequestDelete(deleteNotes.trim() || undefined);
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                  setDeleteNotes('');
                }}
                disabled={!canSubmitDeleteRequest || !deleteReadiness}
                className="w-full h-12 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(239,68,68,0.14)] text-xs font-black uppercase tracking-widest text-red-100 disabled:opacity-50"
              >
                Confirmar Solicitação de Exclusão
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onRequestAccess}
          className="w-full h-14 rounded-2xl border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.08)] text-sm font-black uppercase tracking-widest text-blue-200"
        >
          Solicitar Acesso aos Dados
        </button>
        <button
          onClick={onRequestRectify}
          className="w-full h-14 rounded-2xl border border-[rgba(250,204,21,0.2)] bg-[rgba(234,179,8,0.08)] text-sm font-black uppercase tracking-widest text-amber-200"
        >
          Solicitar Retificação
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

      <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Histórico LGPD</p>
            <p className="mt-1 text-xs text-slate-400">Últimas solicitações do titular com status operacional.</p>
          </div>
          {loadingRequests && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Atualizando</span>}
        </div>

        <div className="mt-4 space-y-3">
          {!loadingRequests && requests.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-[rgba(15,23,42,0.5)] p-3">
              <p className="text-sm font-semibold text-white">Nenhuma solicitação recente.</p>
              <p className="mt-1 text-xs text-slate-400">Novas exportações e pedidos ficam registrados aqui.</p>
            </div>
          )}

          {requests.map((request) => {
            const canCancel = request.status === 'open';

            return (
              <div key={request.id} className="rounded-2xl border border-white/5 bg-[rgba(15,23,42,0.5)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">
                      {request.request_type === 'access' && 'Acesso aos dados'}
                      {request.request_type === 'export' && 'Exportação LGPD'}
                      {request.request_type === 'delete' && 'Exclusão de conta'}
                      {request.request_type === 'rectify' && 'Retificação cadastral'}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {new Date(request.created_at).toLocaleDateString('pt-BR')} • {request.status.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${request.status === 'completed'
                    ? 'bg-[rgba(16,185,129,0.15)] text-emerald-200'
                    : request.status === 'rejected' || request.status === 'cancelled'
                      ? 'bg-[rgba(239,68,68,0.12)] text-red-200'
                      : request.status === 'in_review'
                        ? 'bg-[rgba(59,130,246,0.12)] text-blue-200'
                        : 'bg-[rgba(250,204,21,0.12)] text-amber-200'}`}
                  >
                    {request.status}
                  </span>
                </div>

                {(request.notes || request.resolution_notes) && (
                  <div className="mt-3 space-y-1">
                    {request.notes && <p className="text-xs text-slate-300">Solicitação: {request.notes}</p>}
                    {request.resolution_notes && <p className="text-xs text-slate-400">Tratativa: {request.resolution_notes}</p>}
                  </div>
                )}

                {canCancel && (
                  <button
                    onClick={() => onCancelRequest(request.id)}
                    className="mt-3 h-10 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(239,68,68,0.08)] px-3 text-[10px] font-black uppercase tracking-widest text-red-200"
                  >
                    Cancelar Solicitação
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
