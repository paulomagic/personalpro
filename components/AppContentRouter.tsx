import React, { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { View, Client, Workout } from '../types';
import type { DBUserProfile } from '../services/userProfileService';
import {
  canAccessAdminArea,
  type AppSessionUser,
} from '../services/auth/authFlow';
import { resolvePathFromView } from '../services/navigation/historyNavigation';
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

  const dashboardFallback = renderDashboardFallback();
  const routeFallback = resolvePathFromView(currentView);
  const deniedAdminElement = dashboardFallback;

  return (
    <Routes>
      <Route path={resolvePathFromView(View.LOGIN)} element={<LoginView onLogin={handleLoginSuccess} />} />
      <Route path={resolvePathFromView(View.DASHBOARD)} element={dashboardFallback} />
      <Route path={resolvePathFromView(View.AI_BUILDER)} element={<AIBuilderView user={user} onBack={() => navigateTo(View.DASHBOARD)} onDone={() => navigateTo(View.DASHBOARD)} />} />
      <Route
        path={resolvePathFromView(View.CLIENT_PROFILE)}
        element={selectedClient ? (
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
        ) : dashboardFallback}
      />
      <Route
        path={resolvePathFromView(View.TRAINING_EXECUTION)}
        element={activeWorkout ? (
          <TrainingExecutionView workout={activeWorkout} onFinish={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />
        ) : dashboardFallback}
      />
      <Route path={resolvePathFromView(View.CLIENTS)} element={<ClientsView user={user} onBack={() => navigateTo(View.DASHBOARD)} onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)} />} />
      <Route path={resolvePathFromView(View.METRICS)} element={<MetricsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />} />
      <Route path={resolvePathFromView(View.SETTINGS)} element={<SettingsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} onLogout={handleLogout} />} />
      <Route
        path={resolvePathFromView(View.CALENDAR)}
        element={userProfile?.role === 'student'
          ? <StudentCalendarView user={user} onBack={() => navigateTo(View.STUDENT)} />
          : <CalendarView user={user} onBack={() => navigateTo(View.DASHBOARD)} />}
      />
      <Route path={resolvePathFromView(View.FINANCE)} element={<FinanceView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />} />
      <Route
        path={resolvePathFromView(View.WORKOUT_BUILDER)}
        element={(
          <WorkoutBuilderView
            user={user}
            client={selectedClient}
            onBack={() => navigateTo(View.DASHBOARD)}
            onSave={() => navigateTo(View.DASHBOARD)}
          />
        )}
      />
      <Route
        path={resolvePathFromView(View.ASSESSMENT)}
        element={selectedClient ? (
          <AssessmentView
            user={user}
            client={selectedClient}
            onBack={() => navigateTo(View.CLIENT_PROFILE, selectedClient)}
            onSave={() => navigateTo(View.CLIENT_PROFILE, selectedClient)}
          />
        ) : (
          <DashboardView
            user={user}
            onSelectClient={setSelectedClient}
            onOpenAI={() => navigateTo(View.AI_BUILDER)}
            onNavigate={handleNavigation}
          />
        )}
      />
      <Route
        path={resolvePathFromView(View.STUDENT)}
        element={userProfile?.role === 'student' ? (
          <StudentDashboardView
            user={user}
            onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        ) : (
          <StudentView
            clientId={selectedClient?.id}
            studentName={selectedClient?.name || 'Aluno'}
            coachName={user?.user_metadata?.name || 'Personal responsavel'}
            onCompleteWorkout={() => navigateTo(View.DASHBOARD)}
            onBack={() => selectedClient ? navigateTo(View.CLIENT_PROFILE, selectedClient) : navigateTo(View.DASHBOARD)}
          />
        )}
      />
      <Route
        path={resolvePathFromView(View.STUDENT_PROFILE)}
        element={<StudentProfileView user={user} onBack={() => navigateTo(View.STUDENT)} onSettings={() => navigateTo(View.SETTINGS)} />}
      />
      <Route
        path={resolvePathFromView(View.STUDENT_WORKOUTS)}
        element={(
          <StudentView
            clientId={userProfile?.client_id || undefined}
            studentName={user?.user_metadata?.name || user?.user_metadata?.full_name || 'Aluno'}
            coachName={user?.profile?.name || user?.user_metadata?.coach_name || 'Personal responsavel'}
            onCompleteWorkout={() => navigateTo(View.STUDENT)}
            onBack={() => navigateTo(View.STUDENT)}
          />
        )}
      />
      <Route
        path={resolvePathFromView(View.SPORT_TRAINING)}
        element={<SportTrainingView clientName={selectedClient?.name} onBack={() => navigateTo(View.DASHBOARD)} onSave={() => navigateTo(View.DASHBOARD)} />}
      />
      <Route
        path={resolvePathFromView(View.ADMIN)}
        element={canAccessAdminArea(user) ? (
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
        ) : deniedAdminElement}
      />
      <Route path={resolvePathFromView(View.ADMIN_USERS)} element={canAccessAdminArea(user) ? <AdminUsersView onBack={() => navigateTo(View.ADMIN)} /> : deniedAdminElement} />
      <Route path={resolvePathFromView(View.ADMIN_AI_LOGS)} element={canAccessAdminArea(user) ? <AdminAILogsView onBack={() => navigateTo(View.ADMIN)} /> : deniedAdminElement} />
      <Route path={resolvePathFromView(View.ADMIN_AI_DASHBOARD)} element={canAccessAdminArea(user) ? <AdminAIDashboardView onBack={() => navigateTo(View.ADMIN)} /> : deniedAdminElement} />
      <Route path={resolvePathFromView(View.ADMIN_ACTIVITY_LOGS)} element={canAccessAdminArea(user) ? <AdminActivityLogsView onBack={() => navigateTo(View.ADMIN)} /> : deniedAdminElement} />
      <Route path={resolvePathFromView(View.ADMIN_SETTINGS)} element={canAccessAdminArea(user) ? <AdminSettingsView onBack={() => navigateTo(View.ADMIN)} /> : deniedAdminElement} />
      <Route path="*" element={<Navigate to={routeFallback} replace />} />
    </Routes>
  );
};

export default AppContentRouter;
