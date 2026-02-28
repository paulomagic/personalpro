import React, { useState, useEffect } from 'react';
import { Client, isAdmin } from '../types';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Shield,
  User,
  ShieldAlert,
  ChevronRight,
  MessageCircle,
  Zap,
  Sparkles,
  Activity,
  Brain,
  Cpu,
} from 'lucide-react';
import { mockClients } from '../mocks/demoData';
import { ClientCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import {
  getClients,
  getAppointments,
  getPayments,
  mapDBClientToClient,
  type Appointment,
  type DBClient,
  type Payment,
} from '../services/supabaseClient';
import type { AppSessionUser } from '../services/auth/authFlow';

interface DashboardViewProps {
  user: AppSessionUser | null;
  onSelectClient: (client: Client) => void;
  onOpenAI: () => void;
  onOpenBrandHub?: () => void;
  onNavigate?: (view: string) => void;
}

interface DashboardAppointment {
  id: string;
  time: string;
  clientName: string;
}

type AppointmentWithClient = Appointment & {
  clients?: { name?: string } | null;
};

const DEMO_APPOINTMENTS: DashboardAppointment[] = [
  { id: '1', time: '08:00', clientName: 'Júlia Costa' },
  { id: '2', time: '10:30', clientName: 'Pedro Souza' },
  { id: '3', time: '16:00', clientName: 'Ana Silva' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Quick Actions ──────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: CalendarDays, label: 'Agenda', color: '#3B82F6', bg: 'rgba(59, 130, 246,0.1)', action: 'calendar' },
  { icon: Users, label: 'Alunos', color: '#0099FF', bg: 'rgba(0,153,255,0.1)', action: 'clients' },
  { icon: Wallet, label: 'Financeiro', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', action: 'finance' },
  { icon: BarChart2, label: 'Métricas', color: '#FFB800', bg: 'rgba(255,184,0,0.1)', action: 'metrics' },
];

// ══════════════════════════════════════════════════════════════════════════
const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onSelectClient,
  onOpenAI,
  onNavigate,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>(DEMO_APPOINTMENTS);
  const [revenue, setRevenue] = useState(12450);

  const revenueMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const revenueMonthLabel = revenueMonth.charAt(0).toUpperCase() + revenueMonth.slice(1);
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Coach';

  // ── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        if (user?.isDemo) {
          setClients(mockClients.slice(0, 3));
          setLoadingClients(false);
        }
        return;
      }
      setLoadingClients(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        if (user.isDemo) {
          setClients(mockClients.slice(0, 3));
          setAppointments(DEMO_APPOINTMENTS);
        } else {
          const [clientsData, todayAppts, payments] = await Promise.all([
            getClients(user.id),
            getAppointments(user.id, today),
            getPayments(user.id),
          ]);
          setClients(
            clientsData
              .map((c) => mapDBClientToClient(c as DBClient & { avatar?: string }) as Client)
              .slice(0, 3)
          );
          if (todayAppts.length > 0) {
            setAppointments(
              (todayAppts as AppointmentWithClient[]).map((a) => ({
                id: a.id,
                time: a.time?.slice(0, 5) || '08:00',
                clientName: a.clients?.name || 'Cliente',
              }))
            );
          }
          const paid = payments
            .filter((p: Payment) => p.status === 'paid')
            .reduce((s: number, p: Payment) => s + (p.amount || 0), 0);
          if (paid > 0) setRevenue(paid);
        }
      } catch {
        if (user.isDemo) {
          setClients(mockClients.slice(0, 3));
          setAppointments(DEMO_APPOINTMENTS);
        }
      } finally {
        setLoadingClients(false);
      }
    };
    loadData();
  }, [user]);

  const atRiskClient = clients.find((c) => c.status === 'at-risk' || c.adherence < 60) || clients[0];
  const nextAppointment = appointments[0];
  const activeClients = clients.filter((c) => c.status === 'active').length || clients.length;

  // ════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-36 max-w-md mx-auto relative"
    >

      {/* ─── Header ───────────────────────────────────────────────────── */}
      <motion.header variants={item} className="px-5 pt-14 pb-5 flex justify-between items-start">
        <div>
          {/* AI Chip */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
            style={{
              background: 'rgba(59, 130, 246,0.07)',
              border: '1px solid rgba(59, 130, 246,0.15)',
            }}
          >
            <Cpu size={10} style={{ color: '#3B82F6' }} />
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ color: '#3B82F6' }}
            >
              Apex AI
            </span>
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">
            {timeOfDay()}, {firstName} 👋
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#3D5A80' }}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <div className="flex gap-2 items-center mt-1">
          {isAdmin(user) && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onNavigate?.('admin')}
              className="size-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,184,0,0.08)',
                border: '1px solid rgba(255,184,0,0.18)',
              }}
              title="Área Admin"
            >
              <Shield size={17} style={{ color: '#FFB800' }} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onNavigate?.('settings')}
            className="size-10 rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid rgba(59, 130, 246,0.12)', background: 'rgba(59, 130, 246,0.04)' }}
            aria-label="Abrir perfil"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="m-auto" style={{ color: '#3D5A80', display: 'block', margin: 'auto', marginTop: '7px' }} />
            )}
          </motion.button>
        </div>
      </motion.header>

      {/* ─── Quick Actions ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((qa, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.(qa.action)}
              className="flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl transition-all"
              style={{
                background: 'rgba(59, 130, 246,0.03)',
                border: '1px solid rgba(59, 130, 246,0.07)',
              }}
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: qa.bg }}
              >
                <qa.icon size={18} color={qa.color} strokeWidth={2} />
              </div>
              <span
                className="text-[10px] font-bold leading-none"
                style={{ color: '#7A9FCC' }}
              >
                {qa.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Hero: Agenda Card ────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5 mb-4">
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 40%, #1D4ED8 80%, #3B82F6 100%)',
            boxShadow: '0 20px 60px -10px rgba(30, 58, 138,0.45), 0 0 0 1px rgba(59, 130, 246,0.15)',
          }}
        >
          {/* Atmospheric orbs */}
          <div
            className="absolute -top-10 -right-10 size-48 rounded-full pointer-events-none"
            style={{ background: 'rgba(59, 130, 246,0.15)', filter: 'blur(40px)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 size-36 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,60,200,0.3)', filter: 'blur(32px)' }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={10} className="text-white/60" />
                  <span className="text-[10px] text-white/60 font-black uppercase tracking-[0.15em]">
                    Protocolo do Dia
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-white leading-none">
                    {appointments.length}
                  </span>
                  <span className="text-white/70 text-sm font-semibold mb-2 leading-tight">
                    {appointments.length === 1 ? 'sessão\nagendada' : 'sessões\nagendadas'}
                  </span>
                </div>
              </div>

              {nextAppointment && (
                <div
                  className="rounded-2xl px-3.5 py-3 text-center min-w-[80px]"
                  style={{
                    background: 'rgba(0,0,0,0.22)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <p className="text-[9px] text-white/60 font-black uppercase tracking-wider mb-1">
                    Próximo
                  </p>
                  <p className="text-2xl font-black text-white leading-none">
                    {nextAppointment.time}
                  </p>
                  <p className="text-[9px] text-white/60 mt-1 truncate max-w-[72px]">
                    {nextAppointment.clientName.split(' ')[0]}
                  </p>
                </div>
              )}
            </div>

            {/* Appointment chips */}
            {appointments.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {appointments.map((a) => (
                  <span
                    key={a.id}
                    className="text-[10px] font-bold text-white/80 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {a.time} · {a.clientName.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate?.('calendar')}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Ver agenda completa <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Row ────────────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(0,255,136,0.04)',
              border: '1px solid rgba(0,255,136,0.1)',
            }}
          >
            <div
              className="size-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.15)' }}
            >
              <Wallet size={17} style={{ color: '#00FF88' }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#3D5A80' }}>
              {revenueMonthLabel}
            </p>
            <p className="text-lg font-black text-white leading-tight">
              R$ {(revenue / 1000).toFixed(1)}k
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} style={{ color: '#00FF88' }} />
              <span className="text-[10px] font-black" style={{ color: '#00FF88' }}>+18%</span>
            </div>
          </div>

          {/* Active Students */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(59, 130, 246,0.04)',
              border: '1px solid rgba(59, 130, 246,0.1)',
            }}
          >
            <div
              className="size-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(59, 130, 246,0.1)', border: '1px solid rgba(59, 130, 246,0.15)' }}
            >
              <Users size={17} style={{ color: '#3B82F6' }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#3D5A80' }}>
              Alunos Ativos
            </p>
            <p className="text-lg font-black text-white leading-tight">{activeClients}</p>
            <div className="flex items-center gap-1 mt-1">
              <Zap size={10} style={{ color: '#3B82F6' }} />
              <span className="text-[10px] font-black" style={{ color: '#3B82F6' }}>Sincronizado</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Smart Alert ─────────────────────────────────────────────── */}
      {atRiskClient && (
        <motion.div variants={item} className="px-5 mb-4">
          <div
            onClick={() => onSelectClient(atRiskClient)}
            className="p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.99] group"
            style={{
              background: 'rgba(255,184,0,0.04)',
              border: '1px solid rgba(255,184,0,0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(255,184,0,0.1)' }}
              >
                <ShieldAlert size={18} style={{ color: '#FFB800' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-white">Alerta Neural</p>
                  <span
                    className="px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider"
                    style={{ background: '#FFB800', color: '#030712' }}
                  >
                    IA
                  </span>
                  <ChevronRight size={12} style={{ color: '#3D5A80', marginLeft: 'auto' }} className="ml-auto shrink-0" />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#7A9FCC' }}>
                  <span className="text-white font-semibold">{atRiskClient.name}</span>{' '}
                  {(atRiskClient.status === 'at-risk' || atRiskClient.adherence < 50)
                    ? 'não treina há dias — risco de evasão detectado.'
                    : 'precisa de atenção especial.'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = atRiskClient.phone?.replace(/\D/g, '');
                    if (p) window.open(`https://wa.me/55${p}`, '_blank');
                  }}
                  className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: 'rgba(37,211,102,0.08)',
                    border: '1px solid rgba(37,211,102,0.18)',
                    color: '#25D366',
                  }}
                >
                  <MessageCircle size={12} /> Enviar mensagem
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Recent Students ──────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[15px] font-black text-white tracking-tight">Base de Alunos</h3>
          <button
            onClick={() => onNavigate?.('clients')}
            className="text-[11px] font-black uppercase tracking-wider transition-colors"
            style={{ color: '#3B82F6' }}
          >
            Ver todos →
          </button>
        </div>

        <div className="space-y-2">
          {loadingClients ? (
            <>
              <ClientCardSkeleton />
              <ClientCardSkeleton />
            </>
          ) : clients.length > 0 ? (
            clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                onClick={() => onSelectClient(client)}
                data-testid={`dashboard-client-card-${client.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  background: 'rgba(59, 130, 246,0.03)',
                  border: '1px solid rgba(59, 130, 246,0.06)',
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {client.avatar ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="size-11 rounded-2xl object-cover"
                      style={{ border: '1.5px solid rgba(59, 130, 246,0.1)' }}
                    />
                  ) : (
                    <div
                      className="size-11 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'rgba(59, 130, 246,0.07)',
                        border: '1px solid rgba(59, 130, 246,0.1)',
                      }}
                    >
                      <User size={18} style={{ color: '#3D5A80' }} />
                    </div>
                  )}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2"
                    style={{
                      borderColor: 'var(--bg-void)',
                      background:
                        client.status === 'active'
                          ? '#00FF88'
                          : client.status === 'at-risk'
                            ? '#FFB800'
                            : '#3D5A80',
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-white text-sm truncate">{client.name}</h4>
                    <span
                      className="text-xs font-black ml-2 shrink-0"
                      style={{
                        color: client.adherence < 50 ? '#FFB800' : '#00FF88',
                      }}
                    >
                      {client.adherence}%
                    </span>
                  </div>
                  <p className="text-[11px] truncate mb-1.5" style={{ color: '#3D5A80' }}>
                    {client.goal} · {client.lastTraining || 'Iniciando'}
                  </p>
                  {/* Progress bar */}
                  <div
                    className="h-[3px] w-full rounded-full overflow-hidden"
                    style={{ background: 'rgba(59, 130, 246,0.06)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${client.adherence}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          client.adherence < 50
                            ? 'linear-gradient(90deg, #FF8C00, #FFB800)'
                            : 'linear-gradient(90deg, #1D4ED8, #00FF88)',
                      }}
                    />
                  </div>
                </div>

                <ChevronRight size={13} style={{ color: '#3D5A80', flexShrink: 0 }} />
              </motion.div>
            ))
          ) : (
            <EmptyState
              icon="groups"
              title="Nenhum aluno ainda"
              description="Adicione seu primeiro aluno"
              actionLabel="Adicionar Aluno"
              onAction={() => onNavigate?.('clients')}
              variant="minimal"
            />
          )}
        </div>
      </motion.div>

      {/* ─── AI CTA ───────────────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpenAI}
          className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 45%, #1D4ED8 80%, #3B82F6 100%)',
            boxShadow: '0 12px 40px -6px rgba(30, 58, 138,0.5), 0 0 0 1px rgba(59, 130, 246,0.15)',
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)',
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative flex items-center gap-2.5 text-sm">
            <div
              className="size-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <Brain size={15} />
            </div>
            <span>Gerar Treino com IA</span>
            <Sparkles size={14} className="opacity-70" />
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default DashboardView;
