import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Play, Pause, AlertTriangle, CheckCircle, Calendar, FileText, TrendingUp, Camera, Dumbbell, Clock, Phone, Mail, Edit, Save, X, PlusCircle, User, Zap, Sparkles, UserPlus, Trash2 } from 'lucide-react';
import { Client, MissedClass } from '../types';
import { analyzeClientProgressWithRouter } from '../services/ai/aiRouter';
import { getClientById, updateClientById, deleteClientCascade } from '../services/supabase/domains/clientsDomain';
import { getAssessmentsByClient } from '../services/supabase/domains/assessmentsDomain';
import { getWorkoutsByClient } from '../services/supabase/domains/workoutsDomain';
import { uploadAvatar } from '../services/supabase/domains/storageDomain';
import { mapAssessmentsToClientShape, buildClientPhysicalUpdatePayload } from '../services/clientProfileUtils';
import ClientProfileModals from '../components/clientProfile/ClientProfileModals';
import ClientFinanceSection from '../components/ClientFinanceSection';
import { ClientPhysicalDataForm } from '../components/ClientPhysicalDataForm';
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

  const getStatusColor = (status: Client['status']) => {
    const colors = {
      'active': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'at-risk': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'paused': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      'inactive': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || colors.inactive;
  };

  const getStatusIcon = (status: Client['status']) => {
    const icons = {
      'active': TrendingUp,
      'at-risk': AlertTriangle,
      'paused': Pause,
      'inactive': X
    };
    return icons[status] || X;
  };

  const getReasonLabel = (reason: MissedClass['reason']) => {
    const labels = { sick: 'Doença', travel: 'Viagem', personal: 'Pessoal', other: 'Outro' };
    return labels[reason] || reason;
  };

  const StatusIcon = getStatusIcon(client.status);

  return (
    <div className="max-w-md mx-auto min-h-screen text-white selection:bg-cyan-500/20" style={{ background: 'var(--bg-void)' }}>
      {/* Hero Header */}
      <header className="relative h-72 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={client.avatar_url || client.avatar || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600&fit=crop"}
            className="w-full h-full object-cover scale-110 blur-[2px] opacity-60"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        {/* Top Actions */}
        <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {/* Alterar Foto Button */}
            {coachId && (
              <label
                className={`size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-colors ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/20'}`}
                title="Trocar Foto"
              >
                {isUploadingAvatar ? (
                  <div className="size-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={18} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            )}

            {/* Invite Student Button */}
            {coachId && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="size-10 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
                title="Convidar Aluno"
              >
                <UserPlus size={18} />
              </button>
            )}
            <button
              onClick={() => setShowStatusModal(true)}
              className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Profile Info with visible Avatar */}
        <div className="absolute bottom-4 left-0 right-0 px-6 z-10 flex items-end gap-4">

          {/* Avatar VISÍVEL — letra como fundo, foto por cima */}
          <div className="flex-shrink-0 relative">
            <div className="size-[76px] rounded-2xl border-[3px] border-white/20 overflow-hidden shadow-2xl relative">
              {/* Letra sempre visível como fallback */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)' }}>
                <span className="text-2xl font-black text-white">{client.name.charAt(0)}</span>
              </div>
              {/* Foto por cima — se carregar, cobre a letra; se falhar, letra aparece */}
              {(client.avatar_url || client.avatar) && (
                <img
                  key={client.avatar_url || client.avatar}
                  src={client.avatar_url || client.avatar}
                  alt={client.name}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />
              )}
            </div>
          </div>

          {/* Name + Info */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-white text-[22px] font-bold leading-tight truncate">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-white/80 text-sm font-medium truncate max-w-[120px]">{client.goal}</p>
              <span className="text-white/40">•</span>
              <span className="text-white/70 text-xs">{client.level}</span>
              <span className="text-white/40">•</span>

              {/* Status Badge */}
              <button
                onClick={() => setShowStatusModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md transition-colors ${getStatusColor(client.status)}`}
              >
                <StatusIcon size={12} />
                <span className="text-xs font-bold uppercase">
                  {client.status === 'active' ? 'Ativo' :
                    client.status === 'paused' ? 'Pausado' :
                      client.status === 'at-risk' ? 'Risco' : 'Inativo'}
                </span>
              </button>
            </div>
            {client.suspensionReason && client.status === 'paused' && (
              <p className="text-xs text-slate-400 mt-1">
                ⏸️ Pausado por: {client.suspensionReason === 'travel' ? 'Viagem' :
                  client.suspensionReason === 'sick' ? 'Doença' :
                    client.suspensionReason === 'financial' ? 'Financeiro' : 'Outro'}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Premium Segmented Control (Tabs) */}
      <div className="px-5 mt-6 mb-2">
        <div
          className="flex rounded-[18px] backdrop-blur-md p-1 relative"
          style={isLightTheme
            ? {
              background: 'linear-gradient(145deg, rgba(123, 141, 171, 0.45), rgba(109, 128, 162, 0.5))',
              border: '1px solid rgba(130, 170, 235, 0.38)',
              boxShadow: 'inset 0 1px 0 rgba(224, 236, 255, 0.25)',
            }
            : {
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 flex-1 py-3 px-2 rounded-[14px] flex items-center justify-center transition-all ${activeTab === tab
                ? ''
                : 'text-slate-500 hover:text-slate-300'
                }`}
              style={activeTab === tab ? { color: 'var(--btn-primary-text)' } : undefined}
            >
              <span className="text-[11px] font-black uppercase tracking-wider">{tab}</span>
            </button>
          ))}
          {/* Active Background Pill */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-[14px] z-0"
            style={{
              width: `${100 / tabs.length}%`,
              background: 'var(--btn-primary-bg)',
              border: '1px solid var(--btn-primary-border)',
              boxShadow: 'var(--btn-primary-shadow)',
            }}
            animate={{
              left: `calc(${(tabs.indexOf(activeTab) * (100 / tabs.length))}%)`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
      </div>

      <main className="px-6 space-y-6 pb-28 pt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
            <div className="size-10 rounded-[12px] bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
              <CheckCircle size={18} className="text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{client.adherence}<span className="text-sm text-slate-500 ml-1">%</span></p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Aderência</p>
            {client.adherence >= 80 && (
              <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/10 text-emerald-400 text-[9px] py-1 font-black tracking-widest uppercase">Excelente</div>
            )}
          </div>

          <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
            <div className="size-10 rounded-[12px] bg-blue-500/10 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
              <Dumbbell size={18} className="text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{client.completedClasses || 0}<span className="text-sm font-black text-slate-500 ml-1">/{client.totalClasses || 0}</span></p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Treinos</p>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Evolution Tab */}
          {activeTab === 'Evolução' && (
            <motion.div
              key="evolution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* AI Progress Analysis */}
              {!progressAnalysis && client.assessments && client.assessments.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} style={{ color: '#3B82F6' }} />
                    <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Clique para gerar uma análise personalizada do progresso de {client.name} com base nas avaliações.
                  </p>
                  <button
                    onClick={handleAnalyzeProgress}
                    disabled={loadingAnalysis}
                    className="w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                      border: '1px solid var(--btn-primary-border)',
                      boxShadow: 'var(--btn-primary-shadow)',
                      opacity: loadingAnalysis ? 0.5 : 1,
                    }}
                  >
                    {loadingAnalysis ? (
                      <>
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Analisar Progresso com IA
                      </>
                    )}
                  </button>
                </div>
              )}

              {progressAnalysis && (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} style={{ color: '#3B82F6' }} />
                    <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                    <span className="px-2 py-0.5 text-[9px] font-black text-white rounded-full uppercase" style={{ background: 'linear-gradient(135deg,#1E3A8A,#3B82F6)' }}>Gemini</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">{progressAnalysis.summary}</p>

                  {progressAnalysis.improvements.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">✅ Melhorias</p>
                      <ul className="space-y-1">
                        {progressAnalysis.improvements.map((item, i) => (
                          <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-emerald-500/30">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {progressAnalysis.concerns.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">⚠️ Atenção</p>
                      <ul className="space-y-1">
                        {progressAnalysis.concerns.map((item, i) => (
                          <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {progressAnalysis.recommendations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">💡 Recomendações</p>
                      <ul className="space-y-1">
                        {progressAnalysis.recommendations.map((item, i) => (
                          <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-blue-500/30">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {loadingAnalysis && (
                <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'rgba(59, 130, 246,0.04)', border: '1px solid rgba(59, 130, 246,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} style={{ color: '#3B82F6' }} className="animate-spin" />
                    <p className="text-sm text-slate-400">Analisando progresso com IA...</p>
                  </div>
                </div>
              )}

              {/* Weight Chart */}
              <div className="glass-card rounded-[24px] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-white tracking-tight">
                    Evolução de {chartMode === 'weight' ? 'Peso' : 'Gordura'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartMode('weight')}
                      className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'weight'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                    >
                      Peso
                    </button>
                    <button
                      onClick={() => setChartMode('fat')}
                      className={`px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all ${chartMode === 'fat'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                    >
                      Gordura
                    </button>
                  </div>
                </div>

                {client.assessments && client.assessments.length > 0 ? (
                  <>
                    <div className="h-40 flex items-end justify-between gap-2">
                      {(() => {
                        // Get last 7 assessments, sorted by date
                        const sortedAssessments = [...client.assessments]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(-7);

                        // Get values based on mode
                        const values = sortedAssessments.map(a =>
                          chartMode === 'weight' ? (a.weight || 0) : (a.bodyFat || 0)
                        );

                        // Calculate min/max for scaling
                        const minVal = Math.min(...values.filter(v => v > 0)) * 0.9;
                        const maxVal = Math.max(...values) * 1.1;
                        const range = maxVal - minVal || 1;

                        return sortedAssessments.map((assessment, i) => {
                          const value = chartMode === 'weight' ? (assessment.weight || 0) : (assessment.bodyFat || 0);
                          const heightPercent = value > 0 ? ((value - minVal) / range) * 100 : 0;

                          return (
                            <div key={i} className="flex-1 group relative flex flex-col items-center">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                                transition={{ delay: i * 0.1 }}
                                className={`w-full rounded-t-lg cursor-pointer ${chartMode === 'weight'
                                  ? 'bg-gradient-to-t from-blue-600/20 to-blue-500/80 group-hover:to-blue-400'
                                  : 'bg-gradient-to-t from-amber-600/20 to-amber-500/80 group-hover:to-amber-400'
                                  }`}
                              />
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {value > 0 ? (
                                  chartMode === 'weight' ? `${value} kg` : `${value}%`
                                ) : 'N/A'}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between mt-4 px-1">
                      {[...client.assessments]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(-7)
                        .map((a, i) => (
                          <span key={i} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            {new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center">
                    <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <TrendingUp size={24} className="text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Nenhuma avaliação registrada</p>
                    <p className="text-slate-600 text-xs mt-1">Adicione avaliações para ver a evolução</p>
                  </div>
                )}
              </div>

              {/* Photo Gallery */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-black text-white tracking-tight">Galeria de Evolução</h3>
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                  >Ver Todas</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {client.assessments.slice(0, 3).map((assessment, i) => (
                    <div key={i} className="min-w-[120px] aspect-[3/4] rounded-2xl overflow-hidden relative glass-card p-1">
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                        <Camera size={24} className="text-slate-600" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-3">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">
                          {new Date(assessment.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={onStartAssessment}
                    className="min-w-[120px] aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 transition-all"
                  >
                    <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera size={20} className="text-blue-400" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nova Foto</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'Avaliações' && (
            <motion.div
              key="assessments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={onStartAssessment}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  border: '1px solid var(--btn-primary-border)',
                  boxShadow: 'var(--btn-primary-shadow)',
                }}
              >
                <PlusCircle size={20} />
                Nova Avaliação
              </button>

              <h3 className="font-black text-white tracking-tight text-sm mt-4">Histórico</h3>
              <div className="space-y-3">
                {client.assessments.length > 0 ? client.assessments.map((assessment, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 active:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">
                          {new Date(assessment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="flex gap-3 text-[10px] text-slate-400 font-medium mt-0.5">
                          <span>Peso: <b className="text-white">{assessment.weight}kg</b></span>
                          {assessment.bodyFat && <span>BF: <b className="text-blue-400">{assessment.bodyFat}%</b></span>}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                  </div>
                )) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Nenhuma avaliação registrada ainda.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Treinos Tab */}
          {activeTab === 'Treinos' && (
            <motion.div
              key="workouts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={() => onCreateWorkout ? onCreateWorkout() : onStartWorkout({ title: 'Novo Treino', exercises: [] })}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  border: '1px solid var(--btn-primary-border)',
                  boxShadow: 'var(--btn-primary-shadow)',
                }}
              >
                <Dumbbell size={20} />
                Criar Novo Treino
              </button>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                {onStudentView && (
                  <button
                    onClick={onStudentView}
                    className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <User size={16} />
                    Ver como Aluno
                  </button>
                )}
                {onSportTraining && (
                  <button
                    onClick={onSportTraining}
                    className="py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    style={{ background: 'rgba(59, 130, 246,0.07)', border: '1px solid rgba(59, 130, 246,0.15)', color: '#3B82F6' }}
                  >
                    <Zap size={16} />
                    Esportivo ⭐
                  </button>
                )}
              </div>

              {/* Missed Classes Section */}
              <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    Aulas Perdidas
                  </h3>
                  <button
                    onClick={() => setShowMissedClassModal(true)}
                    className="text-xs font-bold text-blue-400 uppercase tracking-widest"
                  >
                    + Registrar
                  </button>
                </div>

                {client.missedClasses.length > 0 ? (
                  <div className="space-y-2">
                    {client.missedClasses.map((mc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                        <div>
                          <p className="text-xs font-bold text-white">
                            {new Date(mc.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-[10px] text-slate-400">{getReasonLabel(mc.reason)}</p>
                        </div>
                        {mc.replaced ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
                            ✓ Reposta
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkAsReplaced(mc.id!)}
                            className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold hover:bg-blue-500/30 transition-colors"
                          >
                            Marcar como Reposta
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
                    Nenhuma aula perdida registrada 🎉
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Bio Tab */}
          {activeTab === 'Bio' && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Contact Info */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Phone size={14} className="text-blue-400" />
                    Contato
                  </h3>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all"
                  >
                    <Edit size={12} className="inline mr-1" /> Editar
                  </button>
                </div>
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Mail size={14} className="text-slate-500" />
                    {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Phone size={14} className="text-slate-500" />
                    {client.phone}
                    <a
                      href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Finance Section */}
              <ClientFinanceSection
                client={{
                  id: client.id,
                  name: client.name,
                  coach_id: coachId,
                  monthly_fee: (client as any).monthly_fee,
                  payment_day: (client as any).payment_day,
                  payment_type: (client as any).payment_type,
                  session_price: (client as any).session_price,
                }}
                coachId={coachId}
                onUpdate={(updates) => setClient(prev => ({ ...prev, ...updates }))}
              />

              {/* Physical Data Section */}
              <ClientPhysicalDataForm
                age={client.age}
                weight={client.weight}
                height={client.height}
                bodyFat={client.bodyFat}
                compact={false}
                readOnly={false}
                onUpdate={async (data) => {
                  // Atualiza estado local
                  setClient(prev => ({ ...prev, ...data }));

                  // Atualiza no Supabase
                  try {
                    // Converte undefined para null (Supabase não aceita undefined)
                    const updateData = buildClientPhysicalUpdatePayload(data);

                    // Só atualiza se houver dados para atualizar
                    if (Object.keys(updateData).length === 0) return;

                    const updateResult = await updateClientById(client.id, updateData as any);
                    if (!updateResult) {
                      console.error('🔴 Erro ao atualizar dados físicos: updateClientById retornou null');
                    }
                  } catch (err) {
                    console.error('🔴 Erro ao salvar dados físicos:', err);
                  }
                }}
              />

              {/* Notes Section */}
              <div className="glass-card rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText size={14} className="text-blue-400" />
                    Notas do Aluno
                  </h3>
                  <button
                    onClick={() => isEditing ? handleSaveNotes() : setIsEditing(true)}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${isEditing
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                  >
                    {isEditing ? <><Save size={12} className="inline mr-1" /> Salvar</> : <><Edit size={12} className="inline mr-1" /> Editar</>}
                  </button>
                </div>

                {/* Observations */}
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    📝 Observações Gerais
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedObservations}
                      onChange={(e) => setEditedObservations(e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                      rows={2}
                      placeholder="Observações gerais sobre o aluno..."
                    />
                  ) : (
                    <p className="text-sm text-slate-300">
                      {client.observations || <span className="text-slate-500 italic">Sem observações</span>}
                    </p>
                  )}
                </div>

                {/* Injuries */}
                <div>
                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                    ⚠️ Lesões / Restrições
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedInjuries}
                      onChange={(e) => setEditedInjuries(e.target.value)}
                      className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500/50 resize-none"
                      rows={2}
                      placeholder="Lesões e restrições de movimento..."
                    />
                  ) : (
                    <p className="text-sm text-slate-300">
                      {client.injuries || <span className="text-slate-500 italic">Nenhuma lesão registrada</span>}
                    </p>
                  )}
                </div>

                {/* Preferences */}
                <div>
                  <label className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">
                    ❤️ Preferências de Treino
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedPreferences}
                      onChange={(e) => setEditedPreferences(e.target.value)}
                      className="w-full bg-pink-500/5 border border-pink-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-pink-500/50 resize-none"
                      rows={2}
                      placeholder="Exercícios favoritos, estilos de treino..."
                    />
                  ) : (
                    <p className="text-sm text-slate-300">
                      {client.preferences || <span className="text-slate-500 italic">Sem preferências registradas</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="font-bold text-white text-sm mb-3">📅 Datas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Início</p>
                    <p className="text-white font-bold">{client.startDate ? new Date(client.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Último Treino</p>
                    <p className="text-white font-bold">{client.lastTraining}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <button
        onClick={() => onStartWorkout({
          title: 'Treino Rápido',
          objective: 'Demonstração',
          duration: '20min',
          exercises: [
            {
              id: 'demo-1',
              name: 'Supino Reto',
              category: 'chest',
              targetMuscle: 'Peitoral',
              sets: [
                { reps: 12, rest: 60 },
                { reps: 10, rest: 60 },
                { reps: 8, rest: 90 }
              ]
            },
            {
              id: 'demo-2',
              name: 'Agachamento Livre',
              category: 'legs',
              targetMuscle: 'Quadríceps',
              sets: [
                { reps: 15, rest: 90 },
                { reps: 12, rest: 90 },
                { reps: 10, rest: 120 }
              ]
            }
          ]
        })}
        data-testid="quick-workout-button"
        className="fixed bottom-24 right-6 size-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
      >
        <Play size={28} className="ml-1" />
      </button>

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
