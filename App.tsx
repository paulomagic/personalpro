import React, { useState, Suspense, lazy, useCallback } from 'react';
import { View, Client, Workout } from './types';
import { supabase } from './services/supabaseCore';
import { getUserProfile, type DBUserProfile } from './services/userProfileService';
import LoginView from './views/LoginView';
import UpdateBanner from './components/UpdateBanner';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppContentRouter from './components/AppContentRouter';
import ConnectivityBanner from './components/ConnectivityBanner';
import PasswordRecoveryModal from './components/PasswordRecoveryModal';
import {
  resolveViewFromPath,
} from './services/navigation/historyNavigation';
import {
  createDemoUser,
  resolveNavigationView,
  resolvePostLoginView,
  resolveUserRole,
  type AppSessionUser,
  type NavigationIntent
} from './services/auth/authFlow';
import { createScopedLogger } from './services/appLogger';
import { logFrontendError } from './services/loggingService';
import { useAuthSessionSync } from './services/app/useAuthSessionSync';
import { useServiceWorkerUpdates } from './services/app/useServiceWorkerUpdates';
import { useRouterNavigationSync } from './services/app/useRouterNavigationSync';
import { useDeepLinkHydration } from './services/app/useDeepLinkHydration';
import { useFrontendErrorCapture } from './services/app/useFrontendErrorCapture';
import { usePendingRequestsPolling } from './services/app/usePendingRequestsPolling';
import { usePasswordRecovery } from './services/app/usePasswordRecovery';
import { appShellActions, useAppShellStore } from './services/appShellStore';

const Layout = lazy(() => import('./components/Layout'));
const appLogger = createScopedLogger('App');

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
  const currentView = useAppShellStore((snapshot) => snapshot.currentView);
  const selectedClient = useAppShellStore((snapshot) => snapshot.selectedClient);
  const activeWorkout = useAppShellStore((snapshot) => snapshot.activeWorkout);
  const routeHydrating = useAppShellStore((snapshot) => snapshot.routeHydrating);
  const {
    setCurrentView,
    setSelectedClient,
    setActiveWorkout,
    setRouteHydrating,
    resetNavigation
  } = appShellActions;
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<DBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    showRecoveryModal,
    newPassword,
    recoveryError,
    isUpdatingPassword,
    setNewPassword,
    openPasswordRecoveryModal,
    handleUpdatePassword
  } = usePasswordRecovery();
  const requestServiceWorkerUserCachePurge = useCallback(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.active) {
          registration.active.postMessage({ type: 'PURGE_USER_CACHES' });
        }
      })
      .catch(() => {
        // noop
      });
  }, []);

  useAuthSessionSync({
    onPasswordRecovery: openPasswordRecoveryModal,
    setUser,
    setUserProfile,
    setCurrentView,
    requestServiceWorkerUserCachePurge
  });

  useFrontendErrorCapture();

  const {
    updateAvailable,
    setUpdateAvailable,
    handleUpdate
  } = useServiceWorkerUpdates();
  const pendingRequests = usePendingRequestsPolling({ user, userProfile });

  useRouterNavigationSync({
    currentView,
    selectedClient,
    activeWorkout,
    setCurrentView,
    setSelectedClient,
    setActiveWorkout
  });

  useDeepLinkHydration({
    currentView,
    selectedClient,
    activeWorkout,
    user,
    userProfile,
    setCurrentView,
    setSelectedClient,
    setActiveWorkout,
    setRouteHydrating
  });

  const navigateTo = (view: View, data?: Client | Workout) => {
    if (view === View.CLIENT_PROFILE && data) {
      setSelectedClient(data as Client);
    }
    if (view === View.TRAINING_EXECUTION && data) {
      setActiveWorkout(data as Workout);
    }
    setCurrentView(view);
  };

  const navigationIntents: NavigationIntent[] = [
    'home',
    'student_home',
    'clients',
    'metrics',
    'settings',
    'calendar',
    'finance',
    'WORKOUT_BUILDER',
    'student',
    'student_workouts',
    'sport_training',
    'student_profile',
    'admin'
  ];

  const isNavigationIntent = (value: string): value is NavigationIntent => {
    return navigationIntents.includes(value as NavigationIntent);
  };

  const handleNavigation = (nav: string) => {
    if (!isNavigationIntent(nav)) return;
    const role = resolveUserRole(userProfile, user);
    const targetView = resolveNavigationView(nav, role);
    if (targetView) {
      navigateTo(targetView);
    }
  };

  const handleLogout = async () => {
    // Sign out from Supabase first
    requestServiceWorkerUserCachePurge();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setUserProfile(null);
    resetNavigation();
  };

  const handleLoginSuccess = async (loggedUser: AppSessionUser | null) => {
    if (loggedUser) {
      setUser(loggedUser);
      let resolvedProfile: DBUserProfile | null = null;

      // Load user profile to check role
      try {
        const profile = await getUserProfile(loggedUser.id);
        if (profile) {
          resolvedProfile = profile;
          setUserProfile(profile);
          setUser({ ...loggedUser, profile });
        } else if (loggedUser?.user_metadata?.role === 'student') {
          const fallbackStudentProfile: DBUserProfile = {
            id: loggedUser.id,
            role: 'student',
            created_at: '',
            updated_at: ''
          };
          setUserProfile(fallbackStudentProfile);
          navigateTo(resolvePostLoginView(fallbackStudentProfile, loggedUser));
          return;
        }
      } catch (error) {
        appLogger.error('Error loading user profile', error, {
          userId: loggedUser.id
        });
      }

      const routeView = typeof window !== 'undefined' ? resolveViewFromPath(window.location.pathname) : null;
      const postLoginView = resolvePostLoginView(resolvedProfile, loggedUser);
      navigateTo(routeView && routeView !== View.LOGIN ? routeView : postLoginView);
    } else {
      // Fallback or explicit demo (should trigger restricted mode)
      const demoUser = createDemoUser();
      setUser(demoUser);
      navigateTo(View.DASHBOARD);
    }
  };

  const handleDemoLogin = () => {
    handleLoginSuccess(null);
  };

  const getActiveTab = () => {
    switch (currentView) {
      case View.DASHBOARD: return 'home';
      case View.CLIENTS: return 'clients';
      case View.CLIENT_PROFILE: return 'clients';
      case View.METRICS: return 'metrics';
      case View.CALENDAR: return 'calendar';
      case View.FINANCE: return 'finance';
      case View.SETTINGS: return 'settings';
      case View.STUDENT_PROFILE: return 'settings';
      default: return 'home';
    }
  };

  const renderWithBoundary = (content: React.ReactNode) => (
    <AppErrorBoundary
      onError={(error, errorInfo) => {
        void logFrontendError({
          type: 'react_error_boundary',
          message: error.message || 'React boundary error',
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          metadata: { currentView }
        });
      }}
    >
      {content}
    </AppErrorBoundary>
  );

  if (loading || routeHydrating) {
    return renderWithBoundary(
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="size-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-glow"></div>
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Personal Pro...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => (
    <AppContentRouter
      currentView={currentView}
      user={user}
      userProfile={userProfile}
      selectedClient={selectedClient}
      activeWorkout={activeWorkout}
      navigateTo={navigateTo}
      handleNavigation={handleNavigation}
      handleLogout={handleLogout}
      handleLoginSuccess={handleLoginSuccess}
      setSelectedClient={setSelectedClient}
    />
  );

  if (currentView === View.LOGIN) {
    return renderWithBoundary(
      <div className="max-w-md mx-auto min-h-screen bg-slate-950">
        <ConnectivityBanner />
        <LoginView onLogin={handleLoginSuccess} />
        <PasswordRecoveryModal
          show={showRecoveryModal}
          description="Digite sua nova senha de acesso abaixo."
          newPassword={newPassword}
          recoveryError={recoveryError}
          isUpdatingPassword={isUpdatingPassword}
          onPasswordChange={setNewPassword}
          onSubmit={() => {
            void handleUpdatePassword();
          }}
        />
      </div>
    );
  }

  // StudentView doesn't need the Layout dock
  if (currentView === View.STUDENT) {
    return renderWithBoundary(
      <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
        <ConnectivityBanner />
        {updateAvailable && (
          <UpdateBanner
            onUpdate={handleUpdate}
            onDismiss={() => setUpdateAvailable(false)}
          />
        )}
        <Suspense fallback={<ViewLoader />}>
          {renderContent()}
        </Suspense>
      </div>
    );
  }

  return renderWithBoundary(
    <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
      <ConnectivityBanner />
      {updateAvailable && (
        <UpdateBanner
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateAvailable(false)}
        />
      )}
      <Suspense fallback={<ViewLoader />}>
        <Layout activeTab={getActiveTab()} onNavigate={handleNavigation} isStudent={userProfile?.role === 'student'} pendingRequests={pendingRequests}>
          <Suspense fallback={<ViewLoader />}>
            {renderContent()}
          </Suspense>
        </Layout>
      </Suspense>

      <PasswordRecoveryModal
        show={showRecoveryModal}
        description="Você está redefinindo sua senha de acesso. Digite a nova senha abaixo."
        newPassword={newPassword}
        recoveryError={recoveryError}
        isUpdatingPassword={isUpdatingPassword}
        onPasswordChange={setNewPassword}
        onSubmit={() => {
          void handleUpdatePassword();
        }}
      />
    </div>
  );
};

export default App;
