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
  Shield
} from 'lucide-react';
import { mockClients } from '../mocks/demoData';
import { ClientCardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';


interface DashboardViewProps {
  user: any;
  onSelectClient: (client: Client) => void;
  onOpenAI: () => void;
  onOpenBrandHub?: () => void;
  onNavigate?: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, onSelectClient, onOpenAI, onNavigate }) => {
  // Mock Data for Demo
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setLoadingClients(true);
        try {
          const { getClients, getAppointments, getPayments } = await import('../services/supabaseClient');

          // Fetch clients
          if (user.isDemo) {
            setClients(mockClients.slice(0, 3));
          } else {
            const data = await getClients(user.id);
            const mappedData = data.map((c: any) => ({
              ...c,
              startDate: c.created_at,
              avatar: c.avatar || c.avatar_url
            }));
            setClients(mappedData.slice(0, 3));
          }

          // Fetch today's appointments
          const today = new Date().toISOString().split('T')[0];
          const todayAppointments = await getAppointments(user.id, today);
          if (todayAppointments.length > 0) {
            setAppointments(todayAppointments.map((a: any) => ({
              id: a.id,
              time: a.time?.slice(0, 5) || '08:00',
              clientName: a.clients?.name || 'Cliente'
            })));
          }

          // Fetch monthly revenue from paid payments
          const payments = await getPayments(user.id);
          const paidTotal = payments
            .filter((p: any) => p.status === 'paid')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          if (paidTotal > 0) {
            setRevenue(paidTotal);
          }
        } catch (error) {
          console.error("Error loading dashboard data:", error);
          // Fallback to mock data on error or if empty in demo
          if (user.isDemo) {
            setClients(mockClients.slice(0, 3));
            setAppointmentData(); // Helper or just rely on state default
          }
        } finally {
          setLoadingClients(false);
        }
      } else if (user?.isDemo) {
        // Direct Demo Mode handling without api calls
        setClients(mockClients.slice(0, 3));
        setLoadingClients(false);
      }
    };

    // Helper to set appointments (reusing current state default, so actually no-op needed if we just don't overwrite it)
    const setAppointmentData = () => {
      setAppointments([
        { id: '1', time: '08:00', clientName: 'Júlia Costa' },
        { id: '2', time: '10:30', clientName: 'Pedro Souza' },
        { id: '3', time: '16:00', clientName: 'Ana Silva' }
      ]);
    };

    loadData();
  }, [user]);

  const [appointments, setAppointments] = useState([
    { id: '1', time: '08:00', clientName: 'Júlia Costa' },
    { id: '2', time: '10:30', clientName: 'Pedro Souza' },
    { id: '3', time: '16:00', clientName: 'Ana Silva' }
  ]);

  const [revenue, setRevenue] = useState(12450);

  // Find an at-risk client for the notification
  const atRiskClient = clients.find(c => c.status === 'at-risk' || c.adherence < 60) || clients[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const nextAppointment = appointments[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6 pb-32 max-w-md mx-auto"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-start pt-4">
        <div>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-black text-white mt-1">Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Coach'}! 👋</h1>
        </div>
        <div className="flex gap-2">
          {/* Admin Button - Only visible for admins */}
          {isAdmin(user) && (
            <button
              onClick={() => onNavigate && onNavigate('admin')}
              className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center ring-2 ring-amber-500/20 hover:bg-amber-500/20 transition-colors"
              title="Área Admin"
            >
              <Shield size={18} className="text-amber-400" />
            </button>
          )}
          <button
            onClick={() => onNavigate && onNavigate('settings')}
            className="size-10 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-white/10 shadow-glow overflow-hidden"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-slate-400">person</span>
            )}
          </button>
        </div>
      </motion.header>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Agenda', color: 'text-blue-400', bg: 'bg-blue-500/10', action: 'calendar' },
          { icon: Users, label: 'Alunos', color: 'text-purple-400', bg: 'bg-purple-500/10', action: 'clients' },
          { icon: Wallet, label: 'Financeiro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', action: 'finance' },
          { icon: BarChart2, label: 'Métricas', color: 'text-amber-400', bg: 'bg-amber-500/10', action: 'metrics' },
        ].map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate && onNavigate(item.action)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/50 border border-white/5 active:scale-95 transition-transform backdrop-blur-sm"
          >
            <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
              <item.icon size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Appointment Card */}
      <motion.div variants={itemVariants} className="card-blue p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90 z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-200/80 text-xs font-bold uppercase tracking-widest mb-1">Hoje você tem</p>
              <h2 className="text-4xl font-black text-white">{appointments.length} <span className="text-lg font-medium text-blue-200">agendamentos</span></h2>
            </div>
            {nextAppointment && (
              <div className="bg-slate-950/20 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[80px]">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-1">Próximo</p>
                <p className="text-xl font-bold text-white">{nextAppointment.time}</p>
                <p className="text-[10px] text-blue-200 truncate max-w-[80px]">{nextAppointment.clientName}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate && onNavigate('calendar')}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Ver agenda completa
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-16 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-32"></div>
      </motion.div>

      {/* Finance Summary */}
      <motion.div variants={itemVariants} className="card-dark p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Receita de Dezembro</p>
            <h3 className="text-xl font-black text-white">R$ {revenue.toLocaleString('pt-BR')}</h3>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <TrendingUp size={12} />
          +18%
        </div>
      </motion.div>

      {/* Smart Alert */}
      {atRiskClient && (
        <motion.div
          variants={itemVariants}
          onClick={() => onSelectClient(atRiskClient)}
          className="bg-slate-900/50 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer hover:border-amber-500/40"
        >
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-white">Alerta Inteligente</p>
                <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded uppercase">IA</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                <span className="text-white font-bold">{atRiskClient.name}</span> {(atRiskClient.status === 'at-risk' || atRiskClient.adherence < 50) ? 'não treina há dias' : 'precisa de atenção'}.
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Considere entrar em contato.</p>
            </div>
          </div>
          <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </div>
        </motion.div>
      )}

      {/* Recent Students */}
      <motion.div variants={itemVariants} className="space-y-4 pt-2">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-lg font-bold text-white">Alunos Recentes</h3>
          <button
            onClick={() => onNavigate && onNavigate('clients')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wide"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {loadingClients ? (
            <div className="space-y-3">
              <ClientCardSkeleton />
              <ClientCardSkeleton />
              <ClientCardSkeleton />
            </div>
          ) : clients.length > 0 ? (
            clients.map((client) => (
              <div key={client.id} className="card-dark p-3 flex items-center gap-3 active:scale-[0.99] hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => onSelectClient(client)}>
                <div className="relative">
                  {client.avatar ? (
                    <img src={client.avatar} alt={client.name} className="size-12 rounded-full object-cover border-2 border-slate-700" />
                  ) : (
                    <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 text-slate-400">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                  )}
                  {client.status === 'active' && <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>}
                  {client.status === 'at-risk' && <div className="absolute bottom-0 right-0 size-3 bg-amber-500 rounded-full border-2 border-slate-900"></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white text-sm truncate">{client.name}</h4>
                    <span className="text-xs font-bold text-slate-300">{client.adherence}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mb-1.5">{client.goal} • {client.lastTraining || 'Iniciando'}</div>

                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${client.adherence < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${client.adherence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="groups"
              title="Nenhum aluno ainda"
              description="Adicione seu primeiro aluno para começar a gerenciar treinos"
              actionLabel="Adicionar Aluno"
              onAction={() => onNavigate && onNavigate('clients')}
              variant="minimal"
            />
          )}
        </div>
      </motion.div>

      {/* Create Workout AI Action */}
      <motion.div variants={itemVariants}>
        <button
          onClick={onOpenAI}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-white shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
            <Plus size={18} />
          </div>
          NOVO TREINO COM IA
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DashboardView;
