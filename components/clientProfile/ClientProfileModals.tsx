import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Camera, CheckCircle, Mail, Pause, Phone, Save, Trash2, X } from 'lucide-react';
import { Client, MissedClass } from '../../types';
import InviteStudentModal from '../InviteStudentModal';

interface ClientProfileModalsProps {
  client: Client;
  coachId?: string;
  showStatusModal: boolean;
  setShowStatusModal: (value: boolean) => void;
  showMissedClassModal: boolean;
  setShowMissedClassModal: (value: boolean) => void;
  showGalleryModal: boolean;
  setShowGalleryModal: (value: boolean) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (value: boolean) => void;
  showContactModal: boolean;
  setShowContactModal: (value: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (value: boolean) => void;
  isDeleting: boolean;
  handleToggleStatus: (newStatus: Client['status'], reason?: Client['suspensionReason']) => void;
  handleAddMissedClass: () => void;
  handleDeleteClient: () => void;
  handleSaveContact: () => void;
  missedDate: string;
  setMissedDate: (value: string) => void;
  missedReason: MissedClass['reason'];
  setMissedReason: (value: MissedClass['reason']) => void;
  missedNotes: string;
  setMissedNotes: (value: string) => void;
  editedEmail: string;
  setEditedEmail: (value: string) => void;
  editedPhone: string;
  setEditedPhone: (value: string) => void;
  onCancelContact: () => void;
  onStartAssessment: () => void;
}

function getReasonLabel(reason: MissedClass['reason']) {
  const labels = { sick: 'Doenca', travel: 'Viagem', personal: 'Pessoal', other: 'Outro' };
  return labels[reason] || reason;
}

const ClientProfileModals: React.FC<ClientProfileModalsProps> = ({
  client,
  coachId,
  showStatusModal,
  setShowStatusModal,
  showMissedClassModal,
  setShowMissedClassModal,
  showGalleryModal,
  setShowGalleryModal,
  showDeleteConfirm,
  setShowDeleteConfirm,
  showContactModal,
  setShowContactModal,
  showInviteModal,
  setShowInviteModal,
  isDeleting,
  handleToggleStatus,
  handleAddMissedClass,
  handleDeleteClient,
  handleSaveContact,
  missedDate,
  setMissedDate,
  missedReason,
  setMissedReason,
  missedNotes,
  setMissedNotes,
  editedEmail,
  setEditedEmail,
  editedPhone,
  setEditedPhone,
  onCancelContact,
  onStartAssessment
}) => {
  return (
    <>
      <AnimatePresence>
        {showStatusModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowStatusModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 rounded-[28px] p-6 w-full max-w-sm border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-white mb-2">Status do Aluno</h3>
              <p className="text-sm text-slate-400 mb-6">Alterar status de {client.name}</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleToggleStatus('active')}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'active' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <CheckCircle size={20} className="text-emerald-400" />
                  <span className="font-bold text-white">Ativo</span>
                </button>

                <button
                  onClick={() => handleToggleStatus('paused', 'travel')}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'paused' && client.suspensionReason === 'travel' ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <Pause size={20} className="text-blue-400" />
                  <span className="font-bold text-white">Pausado - Viagem</span>
                </button>

                <button
                  onClick={() => handleToggleStatus('paused', 'sick')}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'paused' && client.suspensionReason === 'sick' ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <AlertTriangle size={20} className="text-blue-400" />
                  <span className="font-bold text-white">Pausado - Doenca</span>
                </button>

                <button
                  onClick={() => handleToggleStatus('paused', 'financial')}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'paused' && client.suspensionReason === 'financial' ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <X size={20} className="text-red-400" />
                  <span className="font-bold text-white">Pausado - Financeiro</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all group"
                >
                  <Trash2 size={18} className="text-red-400" />
                  <span className="font-bold text-red-400">Excluir Aluno</span>
                </button>
              </div>

              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full mt-4 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMissedClassModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowMissedClassModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 rounded-[28px] p-6 w-full max-w-sm border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-white mb-4">Registrar Aula Perdida</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Data</label>
                  <input
                    type="date"
                    value={missedDate}
                    onChange={(e) => setMissedDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Motivo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['sick', 'travel', 'personal', 'other'] as MissedClass['reason'][]).map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setMissedReason(reason)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${missedReason === reason ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400'}`}
                      >
                        {getReasonLabel(reason)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Notas (opcional)</label>
                  <input
                    type="text"
                    value={missedNotes}
                    onChange={(e) => setMissedNotes(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                    placeholder="Ex: Gripe forte"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMissedClassModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMissedClass}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-glow hover:bg-blue-500 transition-all"
                >
                  Registrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showGalleryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col"
            onClick={() => setShowGalleryModal(false)}
          >
            <header className="px-6 pt-14 pb-4 flex items-center justify-between">
              <button
                onClick={() => setShowGalleryModal(false)}
                className="size-12 rounded-2xl glass-card flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-white">close</span>
              </button>
              <div className="text-center">
                <h2 className="text-lg font-black text-white">Galeria de Evolucao</h2>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {client.assessments.length} Avaliacoes
                </p>
              </div>
              <button
                onClick={onStartAssessment}
                className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center"
              >
                <Camera size={20} className="text-white" />
              </button>
            </header>

            <div
              className="flex-1 overflow-y-auto px-4 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {client.assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Camera size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Nenhuma foto ainda</h3>
                  <p className="text-sm text-slate-500 mb-6">Registre a primeira avaliacao para comecar a acompanhar a evolucao</p>
                  <button
                    onClick={onStartAssessment}
                    className="px-6 py-3 bg-blue-600 rounded-xl text-white font-bold"
                  >
                    Nova Avaliacao
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {client.assessments.map((assessment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-[3/4] rounded-2xl overflow-hidden relative glass-card p-1 group"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                        <Camera size={32} className="text-slate-600" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4">
                        <span className="text-xs font-black text-white mb-1">
                          {new Date(assessment.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {assessment.weight ? `${assessment.weight} kg` : 'Peso nao registrado'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  <button
                    onClick={onStartAssessment}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera size={24} className="text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Foto</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 rounded-[28px] p-6 w-full max-w-sm border border-red-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-400" />
              </div>

              <h3 className="text-xl font-black text-white mb-2 text-center">Excluir Aluno?</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                Tem certeza que deseja excluir <b className="text-white">{client.name}</b>?
                Todos os dados, avaliacoes, treinos e pagamentos serao <b className="text-red-400">permanentemente deletados</b>.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteClient}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold shadow-glow hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 rounded-[28px] p-6 w-full max-w-sm border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-white mb-2">Editar Contato</h3>
              <p className="text-sm text-slate-400 mb-6">Atualize os dados de contato de {client.name}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    <Mail size={10} className="inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    <Phone size={10} className="inline mr-1" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        if (value.length > 6) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                        } else if (value.length > 2) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                        } else if (value.length > 0) {
                          value = `(${value}`;
                        }
                        setEditedPhone(value);
                      }
                    }}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                    placeholder="(61) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onCancelContact}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContact}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-glow hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InviteStudentModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        coachId={coachId || ''}
        clientId={client.id}
        clientName={client.name}
        clientEmail={client.email}
      />
    </>
  );
};

export default ClientProfileModals;
