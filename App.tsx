
import React, { useState } from 'react';
import { View, Client, Workout } from './types';
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

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

  const renderView = () => {
    switch (currentView) {
      case View.LOGIN:
        return <LoginView onLogin={() => navigateTo(View.DASHBOARD)} />;
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
        return <SettingsView onBack={() => navigateTo(View.DASHBOARD)} onLogout={() => navigateTo(View.LOGIN)} />;
      case View.CALENDAR:
        return <CalendarView onBack={() => navigateTo(View.DASHBOARD)} />;
      case View.FINANCE:
        return <FinanceView onBack={() => navigateTo(View.DASHBOARD)} />;
      default:
        return <LoginView onLogin={() => navigateTo(View.DASHBOARD)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-slate-950 transition-colors duration-300">
      {renderView()}
    </div>
  );
};

export default App;
