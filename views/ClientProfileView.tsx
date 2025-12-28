import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Play, Pause, AlertTriangle, CheckCircle, Calendar, FileText, TrendingUp, Camera, Dumbbell, Clock, Phone, Mail, Edit, Save, X, PlusCircle, User, Zap, Sparkles } from 'lucide-react';
import { Client, MissedClass } from '../types';
import { analyzeClientProgress } from '../services/geminiService';

interface ClientProfileViewProps {
  client: Client;
  onBack: () => void;
  onStartWorkout: (workout: any) => void;
  onStartAssessment: () => void;
  onCreateWorkout?: () => void;
  onStudentView?: () => void;
  onSportTraining?: () => void;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({ client: initialClient, onBack, onStartWorkout, onStartAssessment, onCreateWorkout, onStudentView, onSportTraining }) => {


  const [client, setClient] = useState(initialClient);
  const [activeTab, setActiveTab] = useState('Evolução');
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMissedClassModal, setShowMissedClassModal] = useState(false);

  // Editable fields
  const [editedObservations, setEditedObservations] = useState(client.observations || '');
  const [editedInjuries, setEditedInjuries] = useState(client.injuries || '');
  const [editedPreferences, setEditedPreferences] = useState(client.preferences || '');

  // Missed class form
  const [missedDate, setMissedDate] = useState(new Date().toISOString().split('T')[0]);
  const [missedReason, setMissedReason] = useState<MissedClass['reason']>('sick');
  const [missedNotes, setMissedNotes] = useState('');

  const tabs = ['Evolução', 'Avaliações', 'Treinos', 'Bio'];

  // Progress Analysis State
  const [progressAnalysis, setProgressAnalysis] = useState<{
    summary: string;
    improvements: string[];
    concerns: string[];
    recommendations: string[];
  } | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Manual progress analysis - only when user clicks the button
  const handleAnalyzeProgress = async () => {
    if (client.assessments && client.assessments.length > 0) {
      setLoadingAnalysis(true);
      const analysis = await analyzeClientProgress({
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

  const handleSaveNotes = () => {
    setClient(prev => ({
      ...prev,
      observations: editedObservations,
      injuries: editedInjuries,
      preferences: editedPreferences
    }));
    setIsEditing(false);
  };

  const handleToggleStatus = (newStatus: Client['status'], reason?: Client['suspensionReason']) => {
    setClient(prev => ({
      ...prev,
      status: newStatus,
      suspensionReason: reason,
      suspensionStartDate: newStatus === 'paused' ? new Date().toISOString() : undefined,
      suspensionEndDate: undefined
    }));
    setShowStatusModal(false);
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

  const getStatusColor = (status: Client['status']) => {
    const colors = {
      'active': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'at-risk': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
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
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Hero Header */}
      <header className="relative h-72 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={client.avatar || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600&fit=crop"}
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
          <button
            onClick={() => setShowStatusModal(true)}
            className="size-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-6 left-0 right-0 px-6 z-10">
          <h1 className="text-white text-[28px] font-bold leading-tight">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-white/90 text-base font-medium">{client.goal}</p>
            <span className="text-white/40">•</span>
            <span className="text-white/70 text-sm">{client.level}</span>
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
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-white/5">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 space-y-6 pb-28 pt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 border-l-4 border-blue-500">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Aderência</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">{client.adherence}%</span>
              {client.adherence >= 80 && <span className="text-emerald-400 text-xs font-bold mb-1">Excelente!</span>}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border-l-4 border-purple-500">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Treinos</p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-white">{client.completedClasses || 0}</span>
              <span className="text-slate-500 text-sm font-bold mb-1">/{client.totalClasses || 0}</span>
            </div>
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
                <div className="glass-card rounded-[24px] p-5 border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-purple-400" />
                    <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Clique para gerar uma análise personalizada do progresso de {client.name} com base nas avaliações.
                  </p>
                  <button
                    onClick={handleAnalyzeProgress}
                    disabled={loadingAnalysis}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
                <div className="glass-card rounded-[24px] p-5 border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-purple-400" />
                    <h3 className="font-black text-white tracking-tight">Análise de IA</h3>
                    <span className="px-2 py-0.5 bg-purple-500 text-[9px] font-black text-white rounded-full uppercase">Gemini</span>
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
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">⚠️ Atenção</p>
                      <ul className="space-y-1">
                        {progressAnalysis.concerns.map((item, i) => (
                          <li key={i} className="text-xs text-slate-400 pl-3 border-l-2 border-amber-500/30">{item}</li>
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
                <div className="glass-card rounded-[24px] p-5 border border-purple-500/20 bg-purple-500/5 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400 animate-spin" />
                    <p className="text-sm text-slate-400">Analisando progresso com IA...</p>
                  </div>
                </div>
              )}

              {/* Weight Chart */}
              <div className="glass-card rounded-[24px] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-white tracking-tight">Evolução de Peso</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase">Peso</button>
                    <button className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-black rounded-full uppercase">Gordura</button>
                  </div>
                </div>
                <div className="h-40 flex items-end justify-between gap-2">
                  {[65, 59, 80, 81, 56, 55, 70].map((height, i) => (
                    <div key={i} className="flex-1 group relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: i * 0.1 }}
                        className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500/80 rounded-t-lg group-hover:to-blue-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 px-1">
                  {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'].map(mes => (
                    <span key={mes} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{mes}</span>
                  ))}
                </div>
              </div>

              {/* Photo Gallery */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-black text-white tracking-tight">Galeria de Evolução</h3>
                  <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ver Todas</button>
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
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
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
                    className="py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Zap size={16} />
                    Esportivo ⭐
                  </button>
                )}
              </div>

              {/* Missed Classes Section */}
              <div className="glass-card rounded-2xl p-4 border border-amber-500/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    Aulas Perdidas
                  </h3>
                  <button
                    onClick={() => setShowMissedClassModal(true)}
                    className="text-xs font-bold text-amber-400 uppercase tracking-widest"
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
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Phone size={14} className="text-blue-400" />
                  Contato
                </h3>
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
                  <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                    ⚠️ Lesões / Restrições
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedInjuries}
                      onChange={(e) => setEditedInjuries(e.target.value)}
                      className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500/50 resize-none"
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
        onClick={() => onStartWorkout({ title: 'Peito e Tríceps', objective: 'Hipertrofia', duration: '45min', exercises: [] })}
        className="fixed bottom-24 right-6 size-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
      >
        <Play size={28} className="ml-1" />
      </button>

      {/* Status Modal */}
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
              onClick={e => e.stopPropagation()}
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
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'paused' && client.suspensionReason === 'sick' ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <AlertTriangle size={20} className="text-amber-400" />
                  <span className="font-bold text-white">Pausado - Doença</span>
                </button>

                <button
                  onClick={() => handleToggleStatus('paused', 'financial')}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${client.status === 'paused' && client.suspensionReason === 'financial' ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <X size={20} className="text-red-400" />
                  <span className="font-bold text-white">Pausado - Financeiro</span>
                </button>
              </div>

              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full mt-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missed Class Modal */}
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
              onClick={e => e.stopPropagation()}
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
                    {(['sick', 'travel', 'personal', 'other'] as MissedClass['reason'][]).map(reason => (
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
      </AnimatePresence>
    </div>
  );
};

export default ClientProfileView;
