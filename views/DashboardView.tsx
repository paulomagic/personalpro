import React, { useState, useEffect } from 'react';
import { Client, isAdmin } from '../types';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  Calendar,
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
} from 'lucide-react';
import { mockClients } from '../mocks/demoData';
import { ClientCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { getClients, getAppointments, getPayments, mapDBClientToClient, type Appointment, type DBClient, type Payment } from '../services/supabaseClient';
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
  clients?: {
    name?: string;
  } | null;
};

const DEMO_APPOINTMENTS: DashboardAppointment[] = [
  { id: '1', time: '08:00', clientName: 'Júlia Costa' },
  { id: '2', time: '10:30', clientName: 'Pedro Souza' },
  { id: '3', time: '16:00', clientName: 'Ana Silva' }
];

const DashboardView: React.FC<DashboardViewProps> = ({ user, onSelectClient, onOpenAI, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>(DEMO_APPOINTMENTS);
  const [revenue, setRevenue] = useState(12450);

  const revenueMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const revenueMonthLabel = revenueMonth.charAt(0).toUpperCase() + revenueMonth.slice(1);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setLoadingClients(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          if (user.isDemo) {
            setClients(mockClients.slice(0, 3));
            setAppointments(DEMO_APPOINTMENTS);
          } else {
            const [clientsData, todayAppointments, payments] = await Promise.all([
              getClients(user.id),
              getAppointments(user.id, today),
              getPayments(user.id)
            ]);
            const mappedData = clientsData.map((c) =>
              mapDBClientToClient(c as DBClient & { avatar?: string }) as Client
            );
            setClients(mappedData.slice(0, 3));
            if (todayAppointments.length > 0) {
              setAppointments((todayAppointments as AppointmentWithClient[]).map((a) => ({
                id: a.id,
                time: a.time?.slice(0, 5) || '08:00',
                clientName: a.clients?.name || 'Cliente'
              })));
            }
            const paidTotal = payments
              .filter((p: Payment) => p.status === 'paid')
              .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
            if (paidTotal > 0) setRevenue(paidTotal);
          }
        } catch (error) {
          console.error("Error loading dashboard data:", error);
          if (user.isDemo) {
            setClients(mockClients.slice(0, 3));
            setAppointments(DEMO_APPOINTMENTS);
          }
        } finally {
          setLoadingClients(false);
        }
      } else if (user?.isDemo) {
        setClients(mockClients.slice(0, 3));
        setLoadingClients(false);
      }
    };
    loadData();
  }, [user]);

  const atRiskClient = clients.find(c => c.status === 'at-risk' || c.adherence < 60) || clients[0];
  const nextAppointment = appointments[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  const quickActions = [
    { icon: Calendar, label: 'Agenda', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', action: 'calendar' },
    { icon: Users, label: 'Alunos', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', action: 'clients' },
    { icon: Wallet, label: 'Financeiro', color: '#34D399', bg: 'rgba(52,211,153,0.12)', action: 'finance' },
    { icon: BarChart2, label: 'Métricas', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', action: 'metrics' },
  ];

  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Coach';
  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-36 max-w-md mx-auto"
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.header
        variants={itemVariants}
        className="px-6 pt-12 pb-6 flex justify-between items-start"
      >
        <div>
          <p className="text-xs text-blue-400/80 font-semibold uppercase tracking-[0.15em] mb-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">
            {timeOfDay()}, {firstName} 👋
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin(user) && (
            <button
              onClick={() => onNavigate && onNavigate('admin')}
              className="size-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
              title="Área Admin"
            >
              <Shield size={18} className="text-amber-400" />
            </button>
          )}
          <button
            onClick={() => onNavigate && onNavigate('settings')}
            className="size-10 rounded-2xl overflow-hidden transition-all active:scale-90"
            style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(30,41,59,0.8)' }}
            aria-label="Abrir perfil"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-400 mx-auto my-auto" style={{ margin: 'auto' }} />
            )}
          </button>
        </div>
      </motion.header>

      {/* ─── Quick Actions ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-6 mb-5">
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((item, i) => (
            <motion.button
              key={i}
              onClick={() => onNavigate && onNavigate(item.action)}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-2.5 p-3 rounded-2xl transition-all"
              style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: item.bg }}
              >
                <item.icon size={19} color={item.color} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 leading-none">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Hero Appointment Card ───────────────────────────── */}
      <motion.div variants={itemVariants} className="px-6 mb-5">
        <div
          className="relative overflow-hidden rounded-3xl p-5"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 50%, #7C3AED 100%)',
            boxShadow: '0 20px 60px -12px rgba(79,70,229,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Decorative orbs */}
          <div className="absolute top-[-40px] right-[-40px] size-40 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-30px] left-[-20px] size-32 rounded-full bg-violet-500/30 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-blue-200/90 text-[11px] font-bold uppercase tracking-[0.12em]">
                    Agenda de Hoje
                  </p>
                </div>
                <h2 className="text-5xl font-black text-white leading-none">
                  {appointments.length}
                </h2>
                <p className="text-blue-200/80 text-sm font-medium mt-1">
                  {appointments.length === 1 ? 'sessão agendada' : 'sessões agendadas'}
                </p>
              </div>

              {nextAppointment && (
                <div
                  className="rounded-2xl px-4 py-3 text-center min-w-[88px]"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <p className="text-[10px] text-blue-200/80 font-bold uppercase tracking-wider mb-1">
                    Próximo
                  </p>
                  <p className="text-2xl font-black text-white leading-none">{nextAppointment.time}</p>
                  <p className="text-[10px] text-blue-200/70 mt-1 truncate max-w-[72px]">
                    {nextAppointment.clientName}
                  </p>
                </div>
              )}
            </div>

            {/* Appointment pills */}
            {appointments.length > 1 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {appointments.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className="text-[10px] font-bold text-blue-100 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    {a.time} · {a.clientName.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate && onNavigate('calendar')}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Ver agenda completa
              <ArrowRight size={15} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Row ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-6 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue Card */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)',
              border: '1px solid rgba(52,211,153,0.15)',
            }}
          >
            <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Wallet size={18} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
              {revenueMonthLabel}
            </p>
            <p className="text-lg font-black text-white leading-tight">
              R$ {(revenue / 1000).toFixed(1)}k
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">+18%</span>
            </div>
          </div>

          {/* Active Students */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(139,92,246,0.04) 100%)',
              border: '1px solid rgba(167,139,250,0.15)',
            }}
          >
            <div className="size-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-3">
              <Users size={18} className="text-violet-400" />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
              Alunos Ativos
            </p>
            <p className="text-lg font-black text-white leading-tight">
              {clients.filter(c => c.status === 'active').length || clients.length}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Zap size={10} className="text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400">Em dia</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Smart Alert ─────────────────────────────────────── */}
      {atRiskClient && (
        <motion.div variants={itemVariants} className="px-6 mb-5">
          <div
            onClick={() => onSelectClient(atRiskClient)}
            className="p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.99] group"
            style={{
              background: 'rgba(251,191,36,0.05)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(251,191,36,0.12)' }}
              >
                <ShieldAlert size={19} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Alerta Inteligente</p>
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider"
                      style={{ background: 'rgba(251,191,36,1)', color: '#0f172a' }}
                    >
                      IA
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-white font-semibold">{atRiskClient.name}</span>{' '}
                  {(atRiskClient.status === 'at-risk' || atRiskClient.adherence < 50)
                    ? 'não treina há dias. Risco de evasão.'
                    : 'precisa de atenção especial.'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const phone = atRiskClient.phone?.replace(/\D/g, '');
                    if (phone) window.open(`https://wa.me/55${phone}`, '_blank');
                  }}
                  className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: 'rgba(37,211,102,0.1)',
                    border: '1px solid rgba(37,211,102,0.2)',
                    color: '#25D366',
                  }}
                >
                  <MessageCircle size={13} />
                  Enviar mensagem
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Recent Students ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-6 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-black text-white tracking-tight">Alunos Recentes</h3>
          <button
            onClick={() => onNavigate && onNavigate('clients')}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
          >
            Ver todos →
          </button>
        </div>

        <div className="space-y-2.5">
          {loadingClients ? (
            <>
              <ClientCardSkeleton />
              <ClientCardSkeleton />
              <ClientCardSkeleton />
            </>
          ) : clients.length > 0 ? (
            clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                onClick={() => onSelectClient(client)}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {client.avatar ? (
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="size-11 rounded-2xl object-cover"
                      style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <div
                      className="size-11 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(30,41,59,1)', border: '1.5px solid rgba(255,255,255,0.06)' }}
                    >
                      <User size={18} className="text-slate-500" />
                    </div>
                  )}
                  {/* Status dot */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-slate-950"
                    style={{
                      background: client.status === 'active' ? '#34D399'
                        : client.status === 'at-risk' ? '#FBBF24'
                          : '#64748B'
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white text-sm truncate">{client.name}</h4>
                    <span
                      className="text-xs font-black ml-2 shrink-0"
                      style={{ color: client.adherence < 50 ? '#FBBF24' : '#34D399' }}
                    >
                      {client.adherence}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mb-1.5">
                    {client.goal} · {client.lastTraining || 'Iniciando'}
                  </p>
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${client.adherence}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: client.adherence < 50
                          ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                          : 'linear-gradient(90deg, #10B981, #34D399)'
                      }}
                    />
                  </div>
                </div>

                <ChevronRight size={14} className="text-slate-700 shrink-0" />
              </motion.div>
            ))
          ) : (
            <EmptyState
              icon="groups"
              title="Nenhum aluno ainda"
              description="Adicione seu primeiro aluno para começar"
              actionLabel="Adicionar Aluno"
              onAction={() => onNavigate && onNavigate('clients')}
              variant="minimal"
            />
          )}
        </div>
      </motion.div>

      {/* ─── AI CTA ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpenAI}
          className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
            boxShadow: '0 12px 40px -8px rgba(79,70,229,0.6)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <div className="size-7 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <span>Criar Treino com IA</span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default DashboardView;
