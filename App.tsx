import React, { useState, useEffect } from 'react';
import { View, Client, Workout } from './types';
import { supabase, getCurrentUser } from './services/supabaseClient';
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
import Layout from './components/Layout';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setCurrentView(View.DASHBOARD);
        } else {
          setCurrentView(View.LOGIN);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setCurrentView(View.DASHBOARD);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigateTo(View.LOGIN);
  };

  const handleLoginSuccess = (loggedUser: any) => {
    setUser(loggedUser);
    navigateTo(View.DASHBOARD);
  };

  // Helper to get active tab ID for the Layout Dock
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

  // Show loading screen while checking auth
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
            onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)}
            onOpenAI={() => navigateTo(View.AI_BUILDER)}
            onOpenBrandHub={() => navigateTo(View.LOGO_LAB)}
            onNavigate={handleNavigation}
          />
        );
      case View.AI_BUILDER:
        return <AIBuilderView onBack={() => navigateTo(View.DASHBOARD)} onDone={() => navigateTo(View.DASHBOARD)} />;
      case View.CLIENT_PROFILE:
        return <ClientProfileView client={selectedClient!} onBack={() => navigateTo(View.DASHBOARD)} onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)} />;
      case View.TRAINING_EXECUTION:
        return <TrainingExecutionView workout={activeWorkout!} onFinish={() => navigateTo(View.DASHBOARD)} />;
      case View.LOGO_LAB:
        return <LogoLabView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.CLIENTS:
        return <ClientsView onBack={() => navigateTo(View.DASHBOARD)} onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)} />;
      case View.METRICS:
        return <MetricsView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.SETTINGS:
        return <SettingsView onBack={() => navigateTo(View.DASHBOARD)} onLogout={handleLogout} />;
      case View.CALENDAR:
        return <CalendarView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.FINANCE:
        return <FinanceView onBack={() => navigateTo(View.DASHBOARD)} />;
      default:
        return <LoginView onLogin={handleLoginSuccess} />;
    }
  };

  // Don't show Layout on Login screen
  if (currentView === View.LOGIN) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-950">
        <LoginView onLogin={handleLoginSuccess} />
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
