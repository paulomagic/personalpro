import React, { useState, useEffect } from 'react';
import { View, Client, Workout } from './types';
// import { supabase, getCurrentUser } from './services/supabaseClient'; // REMOVED FOR DEMO MODE
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import AIBuilderView from './views/AIBuilderView';
import ClientProfileView from './views/ClientProfileView';
import TrainingExecutionView from './views/TrainingExecutionView';
import LogoLabView from './views/LogoLabView';
import ClientsView from './views/ClientsView';
import MetricsView from './views/MetricsView';
import SettingsView from './views/SettingsView';
import CalendarView from './views/CalendarView';
import FinanceView from './views/FinanceView';
import WorkoutBuilderView from './views/WorkoutBuilderView';
import AssessmentView from './views/AssessmentView';
import StudentView from './views/StudentView';
import SportTrainingView from './views/SportTrainingView';
import AdminView from './views/AdminView';
import AdminUsersView from './views/AdminUsersView';
import AdminAILogsView from './views/AdminAILogsView';
import AdminActivityLogsView from './views/AdminActivityLogsView';
import AdminSettingsView from './views/AdminSettingsView';
import Layout from './components/Layout';

function App() {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@apex.com',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      user_metadata: {
        name: 'Rodrigo Campanato',
        avatar_url: '/rodrigo-profile.png'
      }
    };
    setUser(demoUser);
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
        return <SettingsView onBack={() => navigateTo(View.DASHBOARD)} onLogout={handleLogout} />;
      case View.CALENDAR:
        return <CalendarView onBack={() => navigateTo(View.DASHBOARD)} />;
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
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
      <Layout activeTab={getActiveTab()} onNavigate={handleNavigation}>
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;

