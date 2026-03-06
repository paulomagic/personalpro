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
  mapDBClientToClient,
  type DBClient,
} from '../services/supabase/domains/clientsDomain';
import { getAppointments, type Appointment } from '../services/supabase/domains/appointmentsDomain';
import { getPayments, type Payment } from '../services/supabase/domains/paymentsDomain';
import type { AppSessionUser } from '../services/auth/authFlow';
import { useTheme } from '../services/ThemeContext';
import { getSafeAvatarUrl } from '../utils/validation';

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
  { icon: CalendarDays, label: 'Agenda', chipClassName: 'bg-[rgba(59,130,246,0.1)]', iconClassName: 'text-[#3B82F6]', action: 'calendar' },
  { icon: Users, label: 'Alunos', chipClassName: 'bg-[rgba(0,153,255,0.1)]', iconClassName: 'text-[#0099FF]', action: 'clients' },
  { icon: Wallet, label: 'Financeiro', chipClassName: 'bg-[rgba(0,255,136,0.1)]', iconClassName: 'text-[#00FF88]', action: 'finance' },
  { icon: BarChart2, label: 'Métricas', chipClassName: 'bg-[rgba(255,184,0,0.1)]', iconClassName: 'text-[#FFB800]', action: 'metrics' },
];

// ══════════════════════════════════════════════════════════════════════════
const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onSelectClient,
  onOpenAI,
  onNavigate,
}) => {
  const { resolvedTheme } = useTheme();
  const isLightTheme = resolvedTheme === 'light';
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>(DEMO_APPOINTMENTS);
  const [revenue, setRevenue] = useState(12450);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const revenueMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const revenueMonthLabel = revenueMonth.charAt(0).toUpperCase() + revenueMonth.slice(1);
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Coach';
  const profileName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Perfil';
  const rawProfileAvatarUrl = user?.user_metadata?.avatar_url;
  const safeProfileAvatarUrl = getSafeAvatarUrl(rawProfileAvatarUrl, profileName);

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
            getClients(user.id, { limit: 50 }),
            getAppointments(user.id, today, { limit: 20 }),
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

  useEffect(() => {
    setProfileImageFailed(false);
  }, [safeProfileAvatarUrl]);

  const featuredAlertClient =
    clients.find((client) => {
      const lastTraining = (client.lastTraining || '').toLowerCase();
      return (
        client.status === 'at-risk'
        || client.status === 'paused'
        || client.adherence < 60
        || lastTraining.includes('dia')
        || lastTraining.includes('não registrado')
      );
    }) ?? clients[0] ?? null;
  const nextAppointment = appointments[0];
  const activeClients = clients.filter((c) => c.status === 'active').length || clients.length;
  const heroTextPrimaryClassName = isLightTheme ? 'text-[#F4F8FF]' : 'text-white';
  const heroTextSecondaryClassName = isLightTheme ? 'text-[rgba(229,239,255,0.8)]' : 'text-[rgba(255,255,255,0.7)]';
  const heroTextMutedClassName = isLightTheme ? 'text-[rgba(214,228,255,0.75)]' : 'text-[rgba(255,255,255,0.6)]';
  const mutedTextClassName = isLightTheme ? 'text-[#3D5A80]' : 'text-[#B8D3FF]';
  const softTextClassName = isLightTheme ? 'text-[#7A9FCC]' : 'text-[#C9DEFF]';
  const chromeIconClassName = isLightTheme ? 'text-[#3D5A80]' : 'text-[#A9CAFF]';
  const heroCardClassName = isLightTheme
    ? 'bg-[linear-gradient(135deg,#1E3A8A_0%,#2455C9_46%,#3B82F6_100%)] shadow-[0_16px_42px_-10px_rgba(30,58,138,0.35),0_0_0_1px_rgba(59,130,246,0.2)]'
    : 'bg-[linear-gradient(135deg,#172554_0%,#1E3A8A_40%,#1D4ED8_80%,#3B82F6_100%)] shadow-[0_20px_60px_-10px_rgba(30,58,138,0.45),0_0_0_1px_rgba(59,130,246,0.15)]';
  const heroGlassButtonClassName = isLightTheme ? 'bg-[rgba(255,255,255,0.16)]' : 'bg-[rgba(255,255,255,0.1)]';
  const aiCtaClassName = isLightTheme
    ? 'bg-[linear-gradient(135deg,#1E3A8A_0%,#2455C9_48%,#3B82F6_100%)] shadow-[0_10px_34px_-6px_rgba(30,58,138,0.35),0_0_0_1px_rgba(59,130,246,0.18)]'
    : 'bg-[linear-gradient(135deg,#172554_0%,#1E3A8A_45%,#1D4ED8_80%,#3B82F6_100%)] shadow-[0_12px_40px_-6px_rgba(30,58,138,0.5),0_0_0_1px_rgba(59,130,246,0.15)]';
  const aiCtaChipClassName = isLightTheme ? 'bg-[rgba(255,255,255,0.18)]' : 'bg-[rgba(255,255,255,0.12)]';

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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.15)]"
          >
            <Cpu size={10} className="text-[#3B82F6]" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#3B82F6]">
              Apex AI
            </span>
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">
            {timeOfDay()}, {firstName} 👋
          </h1>
          <p className={`text-[12px] mt-0.5 ${mutedTextClassName}`}>
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
              className="size-10 rounded-2xl flex items-center justify-center bg-[rgba(255,184,0,0.08)] border border-[rgba(255,184,0,0.18)]"
              title="Área Admin"
            >
              <Shield size={17} className="text-[#FFB800]" />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onNavigate?.('settings')}
            className="size-10 rounded-2xl overflow-hidden border-[1.5px] border-[rgba(59,130,246,0.12)] bg-[rgba(59,130,246,0.04)]"
            aria-label="Abrir perfil"
          >
            {rawProfileAvatarUrl && !profileImageFailed ? (
              <img
                src={safeProfileAvatarUrl}
                alt="Perfil"
                className="w-full h-full object-cover"
                onError={() => setProfileImageFailed(true)}
              />
            ) : (
              <User size={18} className={`block mx-auto mt-[7px] ${chromeIconClassName}`} />
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
              className="flex flex-col items-center gap-2 py-3.5 px-1 rounded-2xl transition-all bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.07)]"
            >
              <div className={`size-10 rounded-xl flex items-center justify-center ${qa.chipClassName}`}>
                <qa.icon size={18} className={qa.iconClassName} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-bold leading-none ${softTextClassName}`}>
                {qa.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Hero: Agenda Card ────────────────────────────────────────── */}
      <motion.div variants={item} className="px-5 mb-4">
        <div
          className={`relative overflow-hidden rounded-3xl p-5 ${heroCardClassName}`}
        >
          {/* Atmospheric orbs */}
          <div
            className="absolute -top-10 -right-10 size-48 rounded-full pointer-events-none bg-[rgba(59,130,246,0.15)] blur-[40px]"
          />
          <div
            className="absolute -bottom-8 -left-8 size-36 rounded-full pointer-events-none bg-[rgba(0,60,200,0.3)] blur-[32px]"
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px]" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={10} className={heroTextMutedClassName} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${heroTextMutedClassName}`}>
                    Protocolo do Dia
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-6xl font-black leading-none ${heroTextPrimaryClassName}`}>
                    {appointments.length}
                  </span>
                  <span className={`text-sm font-semibold mb-2 leading-tight ${heroTextSecondaryClassName}`}>
                    {appointments.length === 1 ? 'sessão\nagendada' : 'sessões\nagendadas'}
                  </span>
                </div>
              </div>

              {nextAppointment && (
                <div
                  className="rounded-2xl px-3.5 py-3 text-center min-w-[80px] bg-[rgba(0,0,0,0.22)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)]"
                >
                  <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${heroTextMutedClassName}`}>
                    Próximo
                  </p>
                  <p className={`text-2xl font-black leading-none ${heroTextPrimaryClassName}`}>
                    {nextAppointment.time}
                  </p>
                  <p className={`text-[9px] mt-1 truncate max-w-[72px] ${heroTextMutedClassName}`}>
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
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)] ${heroTextSecondaryClassName}`}
                  >
                    {a.time} · {a.clientName.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate?.('calendar')}
              className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-[8px] border border-[rgba(255,255,255,0.12)] ${heroTextPrimaryClassName} ${heroGlassButtonClassName}`}
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
            className="p-4 rounded-2xl bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.1)]"
          >
            <div
              className="size-9 rounded-xl flex items-center justify-center mb-3 bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.15)]"
            >
              <Wallet size={17} className="text-[#00FF88]" />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${mutedTextClassName}`}>
              {revenueMonthLabel}
            </p>
            <p className="text-lg font-black text-white leading-tight">
              R$ {(revenue / 1000).toFixed(1)}k
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-[#00FF88]" />
              <span className="text-[10px] font-black text-[#00FF88]">+18%</span>
            </div>
          </div>

          {/* Active Students */}
          <div
            className="p-4 rounded-2xl bg-[rgba(59,130,246,0.04)] border border-[rgba(59,130,246,0.1)]"
          >
            <div
              className="size-9 rounded-xl flex items-center justify-center mb-3 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.15)]"
            >
              <Users size={17} className="text-[#3B82F6]" />
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${mutedTextClassName}`}>
              Alunos Ativos
            </p>
            <p className="text-lg font-black text-white leading-tight">{activeClients}</p>
            <div className="flex items-center gap-1 mt-1">
              <Zap size={10} className="text-[#3B82F6]" />
              <span className="text-[10px] font-black text-[#3B82F6]">Sincronizado</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Smart Alert ─────────────────────────────────────────────── */}
      {featuredAlertClient && (
        <motion.div variants={item} className="px-5 mb-4">
          <div
            onClick={() => onSelectClient(featuredAlertClient)}
            className="p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.99] group bg-[rgba(255,184,0,0.04)] border border-[rgba(255,184,0,0.15)]"
          >
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[rgba(255,184,0,0.1)]"
              >
                <ShieldAlert size={18} className="text-[#FFB800]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-black text-white">Alerta Neural</p>
                  <span
                    className="px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider bg-[#FFB800] text-[#030712]"
                  >
                    IA
                  </span>
                  <ChevronRight size={12} className={`ml-auto shrink-0 ${chromeIconClassName}`} />
                </div>
                <p className={`text-xs leading-relaxed ${softTextClassName}`}>
                  <span className="text-white font-semibold">{featuredAlertClient.name}</span>{' '}
                  {(featuredAlertClient.status === 'at-risk' || featuredAlertClient.adherence < 50)
                    ? 'não treina há dias — risco de evasão detectado.'
                    : 'precisa de atenção especial.'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = featuredAlertClient.phone?.replace(/\D/g, '');
                    if (p) window.open(`https://wa.me/55${p}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all active:scale-95 bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.18)] text-[#25D366]"
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
            className="text-[11px] font-black uppercase tracking-wider transition-colors text-[#3B82F6]"
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
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.99] bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.06)]"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {client.avatar ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="size-11 rounded-2xl object-cover border-[1.5px] border-[rgba(59,130,246,0.1)]"
                    />
                  ) : (
                    <div
                      className="size-11 rounded-2xl flex items-center justify-center bg-[rgba(59,130,246,0.07)] border border-[rgba(59,130,246,0.1)]"
                    >
                      <User size={18} className={chromeIconClassName} />
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--bg-void)] ${
                      client.status === 'active'
                        ? 'bg-[#00FF88]'
                        : client.status === 'at-risk'
                          ? 'bg-[#FFB800]'
                          : 'bg-[#3D5A80]'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-white text-sm truncate">{client.name}</h4>
                    <span
                      className={`text-xs font-black ml-2 shrink-0 ${client.adherence < 50 ? 'text-[#FFB800]' : 'text-[#00FF88]'}`}
                    >
                      {client.adherence}%
                    </span>
                  </div>
                  <p className={`text-[11px] truncate mb-1.5 ${mutedTextClassName}`}>
                    {client.goal} · {client.lastTraining || 'Iniciando'}
                  </p>
                  {/* Progress bar */}
                  <div className="h-[3px] w-full rounded-full overflow-hidden bg-[rgba(59,130,246,0.06)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${client.adherence}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.7, ease: 'easeOut' }}
                      className={`h-full rounded-full ${client.adherence < 50
                        ? 'bg-[linear-gradient(90deg,#FF8C00,#FFB800)]'
                        : 'bg-[linear-gradient(90deg,#1D4ED8,#00FF88)]'
                        }`}
                    />
                  </div>
                </div>

                <ChevronRight size={13} className={`shrink-0 ${chromeIconClassName}`} />
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
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3 relative overflow-hidden ${heroTextPrimaryClassName} ${aiCtaClassName}`}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.07)_50%,transparent_70%)]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="relative flex items-center gap-2.5 text-sm">
            <div
              className={`size-7 rounded-xl flex items-center justify-center ${aiCtaChipClassName}`}
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
