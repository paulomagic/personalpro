import React, { Suspense, lazy, useState } from 'react';
import type { Client } from '../types';
import ClientProfileHeroHeader from '../components/clientProfile/ClientProfileHeroHeader';
import ClientProfileQuickWorkoutFab from '../components/clientProfile/ClientProfileQuickWorkoutFab';
import ClientProfileStatsCards from '../components/clientProfile/ClientProfileStatsCards';
import { useTheme } from '../services/ThemeContext';
import { getReasonLabel, useClientProfileController } from '../hooks/useClientProfileController';

const ClientProfileTabPanels = lazy(() => import('../components/clientProfile/ClientProfileTabPanels'));
const ClientProfileModals = lazy(() => import('../components/clientProfile/ClientProfileModals'));

interface ClientProfileViewProps {
  client: Client;
  coachId?: string;
  onBack: () => void;
  onStartWorkout: (workout: any) => void;
  onStartAssessment: () => void;
  onCreateWorkout?: () => void;
  onStudentView?: () => void;
  onSportTraining?: () => void;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({ client: initialClient, coachId, onBack, onStartWorkout, onStartAssessment, onCreateWorkout, onStudentView, onSportTraining }) => {
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === 'light';
  const [activeTab, setActiveTab] = useState('Bio');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMissedClassModal, setShowMissedClassModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const tabs = ['Bio', 'Treinos', 'Avaliações', 'Evolução'];
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const hasOpenModal = showStatusModal || showMissedClassModal || showInviteModal || showDeleteConfirm || showContactModal || showGalleryModal;
  const {
    client,
    setClient,
    isEditing,
    setIsEditing,
    isDeleting,
    isUploadingAvatar,
    editedEmail,
    setEditedEmail,
    editedPhone,
    setEditedPhone,
    editedObservations,
    setEditedObservations,
    editedInjuries,
    setEditedInjuries,
    editedPreferences,
    setEditedPreferences,
    missedDate,
    setMissedDate,
    missedReason,
    setMissedReason,
    missedNotes,
    setMissedNotes,
    progressAnalysis,
    loadingAnalysis,
    chartMode,
    setChartMode,
    handleAnalyzeProgress,
    handleSaveNotes,
    handleToggleStatus,
    handleAddMissedClass,
    handleMarkAsReplaced,
    handleDeleteClient,
    handleSaveContact,
    handleAvatarChange,
    handlePhysicalDataUpdate
  } = useClientProfileController({
    initialClient,
    coachId,
    onBack
  });

  return (
    <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 bg-[var(--bg-void)]">
      <ClientProfileHeroHeader
        client={client}
        coachId={coachId}
        isUploadingAvatar={isUploadingAvatar}
        onBack={onBack}
        onAvatarChange={async (event) => {
          const hadFile = Boolean(event.target.files?.[0]);
          const success = await handleAvatarChange(event);
          if (hadFile && !success) {
            alert('Erro ao alterar foto. Verifique o bucket "avatars" e tente novamente.');
          }
        }}
        onInviteStudent={() => setShowInviteModal(true)}
        onOpenStatusModal={() => setShowStatusModal(true)}
      />

      {/* Premium Segmented Control (Tabs) */}
      <div className="px-5 mt-6 mb-2">
        <div
          className={`flex rounded-[18px] backdrop-blur-md p-1 relative border ${isLightTheme
            ? 'bg-[linear-gradient(145deg,rgba(123,141,171,0.45),rgba(109,128,162,0.5))] border-[rgba(130,170,235,0.38)] shadow-[inset_0_1px_0_rgba(224,236,255,0.25)]'
            : 'bg-[rgba(15,23,42,0.6)] border-[rgba(255,255,255,0.05)]'
            }`}
        >
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 flex-1 py-3 px-2 rounded-[14px] flex items-center justify-center transition-all ${activeTab === tab
                ? 'text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 space-y-6 pb-28 pt-6">
        <ClientProfileStatsCards
          adherence={client.adherence}
          completedClasses={client.completedClasses}
          totalClasses={client.totalClasses}
        />

        {/* Tab Content */}
        <Suspense fallback={<div className="glass-card rounded-[28px] min-h-[320px] animate-pulse bg-white/5" />}>
          <ClientProfileTabPanels
            activeTab={activeTab as 'Bio' | 'Treinos' | 'Avaliações' | 'Evolução'}
            client={client}
            chartMode={chartMode}
            setChartMode={setChartMode}
            progressAnalysis={progressAnalysis}
            loadingAnalysis={loadingAnalysis}
            handleAnalyzeProgress={handleAnalyzeProgress}
            onStartAssessment={onStartAssessment}
            onOpenGalleryModal={() => setShowGalleryModal(true)}
            onCreateWorkout={onCreateWorkout}
            onStartWorkout={onStartWorkout}
            onStudentView={onStudentView}
            onSportTraining={onSportTraining}
            onOpenMissedClassModal={() => setShowMissedClassModal(true)}
            getReasonLabel={getReasonLabel}
            handleMarkAsReplaced={handleMarkAsReplaced}
            coachId={coachId}
            onFinanceUpdate={(updates) => setClient(prev => ({ ...prev, ...updates }))}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSaveNotes={handleSaveNotes}
            onOpenContactModal={() => setShowContactModal(true)}
            editedObservations={editedObservations}
            setEditedObservations={setEditedObservations}
            editedInjuries={editedInjuries}
            setEditedInjuries={setEditedInjuries}
            editedPreferences={editedPreferences}
            setEditedPreferences={setEditedPreferences}
            onUpdatePhysicalData={handlePhysicalDataUpdate}
          />
        </Suspense>
      </main>

      <ClientProfileQuickWorkoutFab onStartWorkout={onStartWorkout} />

      {hasOpenModal && (
        <Suspense fallback={null}>
          <ClientProfileModals
            client={client}
            coachId={coachId}
            showStatusModal={showStatusModal}
            setShowStatusModal={setShowStatusModal}
            showMissedClassModal={showMissedClassModal}
            setShowMissedClassModal={setShowMissedClassModal}
            showGalleryModal={showGalleryModal}
            setShowGalleryModal={setShowGalleryModal}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            showContactModal={showContactModal}
            setShowContactModal={setShowContactModal}
            showInviteModal={showInviteModal}
            setShowInviteModal={setShowInviteModal}
            isDeleting={isDeleting}
            handleToggleStatus={async (newStatus, reason) => {
              await handleToggleStatus(newStatus, reason);
              setShowStatusModal(false);
            }}
            handleAddMissedClass={() => {
              handleAddMissedClass();
              setShowMissedClassModal(false);
            }}
            handleDeleteClient={async () => {
              const success = await handleDeleteClient();
              if (!success) {
                alert('Erro ao deletar aluno. Tente novamente.');
                setShowDeleteConfirm(false);
              }
            }}
            handleSaveContact={async () => {
              const success = await handleSaveContact();
              if (success) {
                setShowContactModal(false);
                return;
              }
              alert('Erro ao salvar dados de contato. Tente novamente.');
            }}
            missedDate={missedDate}
            setMissedDate={setMissedDate}
            missedReason={missedReason}
            setMissedReason={setMissedReason}
            missedNotes={missedNotes}
            setMissedNotes={setMissedNotes}
            editedEmail={editedEmail}
            setEditedEmail={setEditedEmail}
            editedPhone={editedPhone}
            setEditedPhone={setEditedPhone}
            onCancelContact={() => {
              setEditedEmail(client.email || '');
              setEditedPhone(client.phone || '');
              setShowContactModal(false);
            }}
            onStartAssessment={onStartAssessment}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ClientProfileView;
