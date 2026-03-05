import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Client, MissedClass } from '../types';
import { analyzeClientProgressWithRouter } from '../services/ai/aiRouter';
import { getClientById, updateClientById, deleteClientCascade } from '../services/supabase/domains/clientsDomain';
import { getAssessmentsByClient } from '../services/supabase/domains/assessmentsDomain';
import { getWorkoutsByClient } from '../services/supabase/domains/workoutsDomain';
import { uploadAvatar } from '../services/supabase/domains/storageDomain';
import { mapAssessmentsToClientShape, buildClientPhysicalUpdatePayload } from '../services/clientProfileUtils';
import ClientProfileHeroHeader from '../components/clientProfile/ClientProfileHeroHeader';
import ClientProfileModals from '../components/clientProfile/ClientProfileModals';
import ClientProfileQuickWorkoutFab from '../components/clientProfile/ClientProfileQuickWorkoutFab';
import ClientProfileStatsCards from '../components/clientProfile/ClientProfileStatsCards';
import ClientProfileTabPanels from '../components/clientProfile/ClientProfileTabPanels';
import { useTheme } from '../services/ThemeContext';

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


  const [client, setClient] = useState<Client>({
    assessments: [],
    missedClasses: [],
    workouts: [],
    ...initialClient
  });
  const [activeTab, setActiveTab] = useState('Bio');
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMissedClassModal, setShowMissedClassModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editedEmail, setEditedEmail] = useState(client.email || '');
  const [editedPhone, setEditedPhone] = useState(client.phone || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);


  // Fetch full client data on mount
  useEffect(() => {
    const loadFullData = async () => {
      try {
        const [clientData, assessmentsData, workoutsData] = await Promise.all([
          getClientById(client.id),
          getAssessmentsByClient(client.id),
          getWorkoutsByClient(client.id, { limit: 50 })
        ]);

        // Map backend snake_case to frontend camelCase
        const mappedAssessments = mapAssessmentsToClientShape(assessmentsData);

        // Update client with fresh data from database
        setClient(prev => ({
          ...prev,
          // Map body_fat from DB to bodyFat in frontend
          bodyFat: clientData?.body_fat ?? prev.bodyFat,
          age: clientData?.age ?? prev.age,
          weight: clientData?.weight ?? prev.weight,
          height: clientData?.height ?? prev.height,
          // ✅ Sync avatar from DB to avoid stale state on re-mounts
          avatar: (clientData as any)?.avatar || clientData?.avatar_url || prev.avatar,
          avatar_url: clientData?.avatar_url || prev.avatar_url,
          assessments: mappedAssessments as any[], // Force type
          workouts: workoutsData
        }));

      } catch (error) {
        console.error("Error loading client details:", error);
      }
    };
    if (client.id) {
      loadFullData();
    }
  }, [client.id]);

  // Editable fields
  const [editedObservations, setEditedObservations] = useState(client.observations || '');
  const [editedInjuries, setEditedInjuries] = useState(client.injuries || '');

  // Update contact fields when client changes
  useEffect(() => {
    setEditedEmail(client.email || '');
    setEditedPhone(client.phone || '');
  }, [client.email, client.phone]);
  const [editedPreferences, setEditedPreferences] = useState(client.preferences || '');

  // Missed class form
  const [missedDate, setMissedDate] = useState(new Date().toISOString().split('T')[0]);
  const [missedReason, setMissedReason] = useState<MissedClass['reason']>('sick');
  const [missedNotes, setMissedNotes] = useState('');

  const tabs = ['Bio', 'Treinos', 'Avaliações', 'Evolução'];

  // Progress Analysis State
  const [progressAnalysis, setProgressAnalysis] = useState<{
    summary: string;
    improvements: string[];
    concerns: string[];
    recommendations: string[];
  } | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [chartMode, setChartMode] = useState<'weight' | 'fat'>('weight');

  // Manual progress analysis - only when user clicks the button
  const handleAnalyzeProgress = async () => {
    if (client.assessments && client.assessments.length > 0) {
      setLoadingAnalysis(true);
      const analysis = await analyzeClientProgressWithRouter({
        name: client.name,
        assessments: client.assessments.map(a => ({
          date: a.date,
          weight: a.weight,
          bodyFat: a.bodyFat,
          measures: a.measures
        })),
        goal: client.goal
      });
      setProgressAnalysis(analysis);
      setLoadingAnalysis(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateClientById(client.id, {
        observations: editedObservations,
        injuries: editedInjuries,
        preferences: editedPreferences
      });

      setClient(prev => ({
        ...prev,
        observations: editedObservations,
        injuries: editedInjuries,
        preferences: editedPreferences
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client notes:', error);
    }
  };

  const handleToggleStatus = async (newStatus: Client['status'], reason?: Client['suspensionReason']) => {
    try {
      const updates: any = {
        status: newStatus,
        suspensionReason: reason,
      };

      await updateClientById(client.id, updates);

      setClient(prev => ({
        ...prev,
        status: newStatus,
        suspensionReason: reason,
        suspensionStartDate: newStatus === 'paused' ? new Date().toISOString() : undefined,
        suspensionEndDate: undefined
      }));
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddMissedClass = () => {
    const newMissedClass: MissedClass = {
      id: Math.random().toString(36).substr(2, 9),
      date: missedDate,
      reason: missedReason,
      replaced: false,
      notes: missedNotes
    };
    setClient(prev => ({
      ...prev,
      missedClasses: [...prev.missedClasses, newMissedClass]
    }));
    setShowMissedClassModal(false);
    setMissedNotes('');
  };

  const handleMarkAsReplaced = (missedClassId: string) => {
    setClient(prev => ({
      ...prev,
      missedClasses: prev.missedClasses.map(mc =>
        mc.id === missedClassId ? { ...mc, replaced: true, replacementDate: new Date().toISOString() } : mc
      )
    }));
  };

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    const success = await deleteClientCascade(client.id);
    setIsDeleting(false);

    if (success) {
      // Client deleted successfully, go back to clients list
      onBack();
    } else {
      alert('Erro ao deletar aluno. Tente novamente.');
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      const updates: Partial<Client> = {
        email: editedEmail || null,
        phone: editedPhone || null
      };

      const updateResult = await updateClientById(client.id, updates as any);
      if (!updateResult) {
        console.error('Erro ao atualizar contato: updateClientById retornou null');
        alert('Erro ao salvar dados de contato. Tente novamente.');
        return;
      }

      // Update local state
      setClient(prev => ({
        ...prev,
        email: editedEmail,
        phone: editedPhone
      }));

      setShowContactModal(false);
    } catch (err) {
      console.error('Erro ao salvar contato:', err);
      alert('Erro ao salvar dados de contato. Tente novamente.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coachId) {
      console.warn('[handleAvatarChange] Sem arquivo ou coachId:', { file: !!file, coachId });
      return;
    }

    console.log('[handleAvatarChange] Iniciando upload:', file.name, 'tamanho:', file.size);
    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(file, coachId, client.id);
      console.log('[handleAvatarChange] URL retornada:', publicUrl);
      if (publicUrl) {
        // Atualizar no banco
        const updateResult = await updateClientById(client.id, { avatar_url: publicUrl } as any);
        console.log('[handleAvatarChange] updateClient result:', updateResult);
        // ✅ Atualizar estado local — key prop no img garante re-render correto
        setClient(prev => ({ ...prev, avatar: publicUrl, avatar_url: publicUrl }));
        console.log('[handleAvatarChange] Estado atualizado com nova foto');
      } else {
        alert('Erro ao fazer upload da imagem. Verifique se o bucket "avatars" existe e está configurado como público no Supabase.');
      }
    } catch (error) {
      console.error('[handleAvatarChange] Erro inesperado:', error);
      alert('Erro inesperado ao alterar foto.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handlePhysicalDataUpdate = async (data: Record<string, unknown>) => {
    setClient(prev => ({ ...prev, ...data }));

    try {
      const updateData = buildClientPhysicalUpdatePayload(data as any);
      if (Object.keys(updateData).length === 0) return;

      const updateResult = await updateClientById(client.id, updateData as any);
      if (!updateResult) {
        console.error('🔴 Erro ao atualizar dados físicos: updateClientById retornou null');
      }
    } catch (err) {
      console.error('🔴 Erro ao salvar dados físicos:', err);
    }
  };

  const getReasonLabel = (reason: MissedClass['reason']) => {
    const labels = { sick: 'Doença', travel: 'Viagem', personal: 'Pessoal', other: 'Outro' };
    return labels[reason] || reason;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20 bg-[var(--bg-void)]">
      <ClientProfileHeroHeader
        client={client}
        coachId={coachId}
        isUploadingAvatar={isUploadingAvatar}
        onBack={onBack}
        onAvatarChange={handleAvatarChange}
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
                ? 'text-[var(--btn-primary-text)]'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider">{tab}</span>
            </button>
          ))}
          {/* Active Background Pill */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-[14px] z-0 bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)]"
            style={{
              width: `${100 / tabs.length}%`,
            }}
            animate={{
              left: `calc(${(tabs.indexOf(activeTab) * (100 / tabs.length))}%)`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
      </div>

      <main className="px-6 space-y-6 pb-28 pt-6">
        <ClientProfileStatsCards
          adherence={client.adherence}
          completedClasses={client.completedClasses}
          totalClasses={client.totalClasses}
        />

        {/* Tab Content */}
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
      </main>

      <ClientProfileQuickWorkoutFab onStartWorkout={onStartWorkout} />

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
        handleToggleStatus={handleToggleStatus}
        handleAddMissedClass={handleAddMissedClass}
        handleDeleteClient={handleDeleteClient}
        handleSaveContact={handleSaveContact}
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
    </div>
  );
};

export default ClientProfileView;
