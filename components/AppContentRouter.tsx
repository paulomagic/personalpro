import React, { lazy } from 'react';
import { View, Client, Workout } from '../types';
import type { DBUserProfile } from '../services/userProfileService';
import {
  canAccessAdminArea,
  type AppSessionUser,
} from '../services/auth/authFlow';
import LoginView from '../views/LoginView';

const AIBuilderView = lazy(() => import('../views/AIBuilderView'));
const DashboardView = lazy(() => import('../views/DashboardView'));
const ClientProfileView = lazy(() => import('../views/ClientProfileView'));
const TrainingExecutionView = lazy(() => import('../views/TrainingExecutionView'));
const ClientsView = lazy(() => import('../views/ClientsView'));
const SettingsView = lazy(() => import('../views/SettingsView'));
const CalendarView = lazy(() => import('../views/CalendarView'));
const MetricsView = lazy(() => import('../views/MetricsView'));
const FinanceView = lazy(() => import('../views/FinanceView'));
const WorkoutBuilderView = lazy(() => import('../views/WorkoutBuilderView'));
const AssessmentView = lazy(() => import('../views/AssessmentView'));
const StudentView = lazy(() => import('../views/StudentView'));
const SportTrainingView = lazy(() => import('../views/SportTrainingView'));
const AdminView = lazy(() => import('../views/AdminView'));
const AdminUsersView = lazy(() => import('../views/AdminUsersView'));
const AdminAILogsView = lazy(() => import('../views/AdminAILogsView'));
const AdminAIDashboardView = lazy(() => import('../views/AdminAIDashboardView'));
const AdminActivityLogsView = lazy(() => import('../views/AdminActivityLogsView'));
const AdminSettingsView = lazy(() => import('../views/AdminSettingsView'));
const StudentDashboardView = lazy(() => import('../views/StudentDashboardView'));
const StudentProfileView = lazy(() => import('../views/StudentProfileView'));
const StudentCalendarView = lazy(() => import('../views/StudentCalendarView'));

interface AppContentRouterProps {
  currentView: View;
  user: AppSessionUser | null;
  userProfile: DBUserProfile | null;
  selectedClient: Client | null;
  activeWorkout: Workout | null;
  navigateTo: (view: View, data?: Client | Workout) => void;
  handleNavigation: (nav: string) => void;
  handleLogout: () => Promise<void> | void;
  handleLoginSuccess: (loggedUser: AppSessionUser | null) => void | Promise<void>;
  setSelectedClient: React.Dispatch<React.SetStateAction<Client | null>>;
}

const AppContentRouter: React.FC<AppContentRouterProps> = ({
  currentView,
  user,
  userProfile,
  selectedClient,
  activeWorkout,
  navigateTo,
  handleNavigation,
  handleLogout,
  handleLoginSuccess,
  setSelectedClient
}) => {
  const renderDashboardFallback = () => (
    <DashboardView
      user={user}
      onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)}
      onOpenAI={() => navigateTo(View.AI_BUILDER)}
      onNavigate={handleNavigation}
    />
  );

  switch (currentView) {
    case View.LOGIN:
      return <LoginView onLogin={handleLoginSuccess} />;
    case View.DASHBOARD:
      return renderDashboardFallback();
    case View.AI_BUILDER:
      return <AIBuilderView user={user} onBack={() => navigateTo(View.DASHBOARD)} onDone={() => navigateTo(View.DASHBOARD)} />;
    case View.CLIENT_PROFILE:
      if (!selectedClient) return renderDashboardFallback();
      return (
        <ClientProfileView
          client={selectedClient}
          coachId={user?.id}
          onBack={() => navigateTo(View.DASHBOARD)}
          onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)}
          onStartAssessment={() => navigateTo(View.ASSESSMENT)}
          onCreateWorkout={() => navigateTo(View.WORKOUT_BUILDER)}
          onStudentView={() => navigateTo(View.STUDENT)}
          onSportTraining={() => navigateTo(View.SPORT_TRAINING)}
        />
      );
    case View.TRAINING_EXECUTION:
      if (!activeWorkout) return renderDashboardFallback();
      return <TrainingExecutionView workout={activeWorkout} onFinish={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />;
    case View.CLIENTS:
      return <ClientsView user={user} onBack={() => navigateTo(View.DASHBOARD)} onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)} />;
    case View.METRICS:
      return <MetricsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />;
    case View.SETTINGS:
      return <SettingsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} onLogout={handleLogout} />;
    case View.CALENDAR:
      if (userProfile?.role === 'student') {
        return <StudentCalendarView user={user} onBack={() => navigateTo(View.STUDENT)} />;
      }
      return <CalendarView user={user} onBack={() => navigateTo(View.DASHBOARD)} />;
    case View.FINANCE:
      return <FinanceView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />;
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
        return (
          <DashboardView
            user={user}
            onSelectClient={setSelectedClient}
            onOpenAI={() => navigateTo(View.AI_BUILDER)}
            onNavigate={handleNavigation}
          />
        );
      }
      return (
        <AssessmentView
          user={user}
          client={selectedClient}
          onBack={() => navigateTo(View.CLIENT_PROFILE, selectedClient)}
          onSave={() => {
            navigateTo(View.CLIENT_PROFILE, selectedClient);
          }}
        />
      );
    case View.STUDENT:
      if (userProfile?.role === 'student') {
        return (
          <StudentDashboardView
            user={user}
            onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        );
      }
      return (
        <StudentView
          clientId={selectedClient?.id}
          studentName={selectedClient?.name || 'Aluno Demo'}
          coachName={user?.user_metadata?.name || 'Personal'}
          onCompleteWorkout={() => navigateTo(View.DASHBOARD)}
          onBack={() => selectedClient ? navigateTo(View.CLIENT_PROFILE, selectedClient) : navigateTo(View.DASHBOARD)}
        />
      );
    case View.STUDENT_PROFILE:
      return (
        <StudentProfileView
          user={user}
          onBack={() => navigateTo(View.STUDENT)}
          onSettings={() => navigateTo(View.SETTINGS)}
        />
      );
    case View.STUDENT_WORKOUTS:
      return (
        <StudentView
          clientId={userProfile?.client_id || undefined}
          studentName={user?.user_metadata?.name || user?.user_metadata?.full_name || 'Aluno'}
          coachName="Seu Personal"
          onCompleteWorkout={() => navigateTo(View.STUDENT)}
          onBack={() => navigateTo(View.STUDENT)}
        />
      );
    case View.SPORT_TRAINING:
      return (
        <SportTrainingView
          clientName={selectedClient?.name}
          onBack={() => navigateTo(View.DASHBOARD)}
          onSave={() => {
            navigateTo(View.DASHBOARD);
          }}
        />
      );
    case View.ADMIN:
    case View.ADMIN_USERS:
    case View.ADMIN_AI_LOGS:
    case View.ADMIN_AI_DASHBOARD:
    case View.ADMIN_ACTIVITY_LOGS:
    case View.ADMIN_SETTINGS:
      if (!canAccessAdminArea(user)) {
        console.warn('🔒 Acesso negado: usuário não é admin');
        return renderDashboardFallback();
      }
      if (currentView === View.ADMIN) {
        return (
          <AdminView
            onBack={() => navigateTo(View.DASHBOARD)}
            onNavigate={(subView) => {
              switch (subView) {
                case 'users': navigateTo(View.ADMIN_USERS); break;
                case 'ai-dashboard': navigateTo(View.ADMIN_AI_DASHBOARD); break;
                case 'ai-logs': navigateTo(View.ADMIN_AI_LOGS); break;
                case 'activity-logs': navigateTo(View.ADMIN_ACTIVITY_LOGS); break;
                case 'settings': navigateTo(View.ADMIN_SETTINGS); break;
              }
            }}
          />
        );
      }
      if (currentView === View.ADMIN_USERS) {
        return <AdminUsersView onBack={() => navigateTo(View.ADMIN)} />;
      }
      if (currentView === View.ADMIN_AI_LOGS) {
        return <AdminAILogsView onBack={() => navigateTo(View.ADMIN)} />;
      }
      if (currentView === View.ADMIN_AI_DASHBOARD) {
        return <AdminAIDashboardView onBack={() => navigateTo(View.ADMIN)} />;
      }
      if (currentView === View.ADMIN_ACTIVITY_LOGS) {
        return <AdminActivityLogsView onBack={() => navigateTo(View.ADMIN)} />;
      }
      if (currentView === View.ADMIN_SETTINGS) {
        return <AdminSettingsView onBack={() => navigateTo(View.ADMIN)} />;
      }
      return null;
    default:
      return <LoginView onLogin={handleLoginSuccess} />;
  }
};

export default AppContentRouter;
