import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, Client, Workout, AppUser } from './types';
import { supabase } from './services/supabaseClient';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ClientProfileView from './views/ClientProfileView';
import TrainingExecutionView from './views/TrainingExecutionView';
import ClientsView from './views/ClientsView';
import SettingsView from './views/SettingsView';
import CalendarView from './views/CalendarView';
import Layout from './components/Layout';

// Lazy load heavy views to reduce initial bundle size
const AIBuilderView = lazy(() => import('./views/AIBuilderView'));
const LogoLabView = lazy(() => import('./views/LogoLabView'));
const MetricsView = lazy(() => import('./views/MetricsView'));
const FinanceView = lazy(() => import('./views/FinanceView'));
const WorkoutBuilderView = lazy(() => import('./views/WorkoutBuilderView'));
const AssessmentView = lazy(() => import('./views/AssessmentView'));
const StudentView = lazy(() => import('./views/StudentView'));
const SportTrainingView = lazy(() => import('./views/SportTrainingView'));
const AdminView = lazy(() => import('./views/AdminView'));
const AdminUsersView = lazy(() => import('./views/AdminUsersView'));
const AdminAILogsView = lazy(() => import('./views/AdminAILogsView'));
const AdminActivityLogsView = lazy(() => import('./views/AdminActivityLogsView'));
const AdminSettingsView = lazy(() => import('./views/AdminSettingsView'));

// Loading fallback component
const ViewLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm font-medium">Carregando...</p>
    </div>
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Auth state listener - handle session expiration and logout from other tabs
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setCurrentView(View.LOGIN);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const navigateTo = (view: View, data?: any) => {
    if (view === View.CLIENT_PROFILE && data) {
      setSelectedClient(data);
    }
    if (view === View.TRAINING_EXECUTION && data) {
      setActiveWorkout(data);
    }
    setCurrentView(view);
  };

  const handleNavigation = (nav: string) => {
    switch (nav) {
      case 'home':
        navigateTo(View.DASHBOARD);
        break;
      case 'clients':
        navigateTo(View.CLIENTS);
        break;
      case 'metrics':
        navigateTo(View.METRICS);
        break;
      case 'settings':
        navigateTo(View.SETTINGS);
        break;
      case 'calendar':
        navigateTo(View.CALENDAR);
        break;
      case 'finance':
        navigateTo(View.FINANCE);
        break;
      case 'WORKOUT_BUILDER':
        navigateTo(View.WORKOUT_BUILDER);
        break;
      case 'student':
        navigateTo(View.STUDENT);
        break;
      case 'sport_training':
        navigateTo(View.SPORT_TRAINING);
        break;
      case 'admin':
        navigateTo(View.ADMIN);
        break;
    }
  };

  const handleLogout = async () => {
    setUser(null);
    navigateTo(View.LOGIN);
  };

  const handleLoginSuccess = (loggedUser: any) => {
    if (loggedUser) {
      setUser(loggedUser);
    } else {
      // Fallback or explicit demo (should trigger restricted mode)
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@apex.com',
        user_metadata: {
          name: 'Modo Demonstração',
          avatar_url: ''
        },
        isDemo: true
      };
      setUser(demoUser);
    }
    navigateTo(View.DASHBOARD);
  };

  const handleDemoLogin = () => {
    handleLoginSuccess(null);
  };

  const getActiveTab = () => {
    switch (currentView) {
      case View.DASHBOARD: return 'home';
      case View.CLIENTS: return 'clients';
      case View.METRICS: return 'metrics';
      case View.CALENDAR: return 'calendar';
      case View.FINANCE: return 'finance';
      default: return 'home';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="size-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-glow"></div>
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Protocolo Apex...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case View.LOGIN:
        return <LoginView onLogin={handleLoginSuccess} />;
      case View.DASHBOARD:
        return (
          <DashboardView
            user={user}
            onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)}
            onOpenAI={() => navigateTo(View.AI_BUILDER)}
            onOpenBrandHub={() => navigateTo(View.LOGO_LAB)}
            onNavigate={handleNavigation}
          />
        );
      case View.AI_BUILDER:
        return <AIBuilderView user={user} onBack={() => navigateTo(View.DASHBOARD)} onDone={() => navigateTo(View.DASHBOARD)} />;
      case View.CLIENT_PROFILE:
        return <ClientProfileView
          client={selectedClient!}
          onBack={() => navigateTo(View.DASHBOARD)}
          onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)}
          onStartAssessment={() => navigateTo(View.ASSESSMENT)}
          onCreateWorkout={() => navigateTo(View.WORKOUT_BUILDER)}
          onStudentView={() => navigateTo(View.STUDENT)}
          onSportTraining={() => navigateTo(View.SPORT_TRAINING)}
        />;
      case View.TRAINING_EXECUTION:
        return <TrainingExecutionView workout={activeWorkout!} onFinish={() => navigateTo(View.DASHBOARD)} />;
      case View.LOGO_LAB:
        return <LogoLabView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.CLIENTS:
        return <ClientsView user={user} onBack={() => navigateTo(View.DASHBOARD)} onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)} />;
      case View.METRICS:
        return <MetricsView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.SETTINGS:
        return <SettingsView user={user} onBack={() => navigateTo(View.DASHBOARD)} onLogout={handleLogout} />;
      case View.CALENDAR:
        return <CalendarView user={user} onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.FINANCE:
        return <FinanceView user={user} onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.WORKOUT_BUILDER:
        return (
          <WorkoutBuilderView
            user={user}
            client={selectedClient}
            onBack={() => navigateTo(View.DASHBOARD)}
            onSave={() => {
              navigateTo(View.DASHBOARD);
            }}
          />
        );
      case View.ASSESSMENT:
        if (!selectedClient) {
          return <DashboardView user={user} onSelectClient={setSelectedClient} onOpenAI={() => navigateTo(View.AI_BUILDER)} onNavigate={handleNavigation} />;
        }
        return (
          <AssessmentView
            user={user}
            client={selectedClient}
            onBack={() => navigateTo(View.CLIENT_PROFILE, selectedClient)}
            onSave={(assessment) => {
              navigateTo(View.CLIENT_PROFILE, selectedClient);
            }}
          />
        );
      case View.STUDENT:
        return (
          <StudentView
            studentName={selectedClient?.name || 'Aluno Demo'}
            coachName={user?.user_metadata?.name || 'Personal'}
            onCompleteWorkout={() => navigateTo(View.DASHBOARD)}
            onBack={() => selectedClient ? navigateTo(View.CLIENT_PROFILE, selectedClient) : navigateTo(View.DASHBOARD)}
          />
        );
      case View.SPORT_TRAINING:
        return (
          <SportTrainingView
            clientName={selectedClient?.name}
            onBack={() => navigateTo(View.DASHBOARD)}
            onSave={(workout) => {
              console.log('Sport workout saved:', workout);
              navigateTo(View.DASHBOARD);
            }}
          />
        );
      // Admin Views
      case View.ADMIN:
        return (
          <AdminView
            onBack={() => navigateTo(View.DASHBOARD)}
            onNavigate={(subView) => {
              switch (subView) {
                case 'users': navigateTo(View.ADMIN_USERS); break;
                case 'ai-logs': navigateTo(View.ADMIN_AI_LOGS); break;
                case 'activity-logs': navigateTo(View.ADMIN_ACTIVITY_LOGS); break;
                case 'settings': navigateTo(View.ADMIN_SETTINGS); break;
              }
            }}
          />
        );
      case View.ADMIN_USERS:
        return <AdminUsersView onBack={() => navigateTo(View.ADMIN)} />;
      case View.ADMIN_AI_LOGS:
        return <AdminAILogsView onBack={() => navigateTo(View.ADMIN)} />;
      case View.ADMIN_ACTIVITY_LOGS:
        return <AdminActivityLogsView onBack={() => navigateTo(View.ADMIN)} />;
      case View.ADMIN_SETTINGS:
        return <AdminSettingsView onBack={() => navigateTo(View.ADMIN)} />;
      default:
        return <LoginView onLogin={handleLoginSuccess} />;
    }
  };

  if (currentView === View.LOGIN) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-950">
        <LoginView onLogin={handleLoginSuccess} />
      </div>
    );
  }

  // StudentView doesn't need the Layout dock
  if (currentView === View.STUDENT) {
    return (
      <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
        <Suspense fallback={<ViewLoader />}>
          {renderContent()}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
      <Layout activeTab={getActiveTab()} onNavigate={handleNavigation}>
        <Suspense fallback={<ViewLoader />}>
          {renderContent()}
        </Suspense>
      </Layout>
    </div>
  );
};

export default App;

