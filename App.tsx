import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { View, Client, Workout } from './types';
import { supabase } from './services/supabaseCore';
import { getUserProfile, countPendingRescheduleRequests, type DBUserProfile } from './services/userProfileService';
import LoginView from './views/LoginView';
import UpdateBanner from './components/UpdateBanner';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppContentRouter from './components/AppContentRouter';
import {
  buildNavigationUrl,
  isView,
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
import { logFrontendError } from './services/loggingService';

const Layout = lazy(() => import('./components/Layout'));

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
  const [currentView, setCurrentView] = useState<View>(() => {
    if (typeof window === 'undefined') return View.LOGIN;
    return resolveViewFromPath(window.location.pathname) || View.LOGIN;
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<DBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeHydrating, setRouteHydrating] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);  // Reschedule requests count
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const historyInitializedRef = useRef(false);
  const previousViewRef = useRef<View>(View.LOGIN);
  const historyPopRef = useRef(false);

  // Password Recovery State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const requestServiceWorkerUserCachePurge = () => {
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
  };

  // Auth state listener - handle session expiration and logout from other tabs
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Triggers the special modal for user to type new password
          setShowRecoveryModal(true);
        }

        if (event === 'SIGNED_OUT' || !session) {
          requestServiceWorkerUserCachePurge();
          setUser(null);
          setUserProfile(null);
          setCurrentView(View.LOGIN);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const signedInUser = session.user as AppSessionUser;
          setUser(signedInUser);
          getUserProfile(session.user.id).then((profile) => {
            if (profile) {
              setUserProfile(profile);
              setUser({ ...signedInUser, profile });
            }
          }).catch((error) => {
            console.error('Error loading profile on SIGNED_IN:', error);
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Global frontend error capture to improve production diagnostics.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onError = (event: ErrorEvent) => {
      void logFrontendError({
        type: 'runtime_error',
        message: event.message || 'Unknown runtime error',
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : JSON.stringify(reason);

      void logFrontendError({
        type: 'promise_rejection',
        message,
        stack: reason instanceof Error ? reason.stack : undefined
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  // Service Worker update detection - show banner instead of auto-reload
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let intervalId: number | null = null;
    let refreshing = false;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.serviceWorker.ready.then((registration) => {
        void registration.update();
      }).catch(() => {
        // noop
      });
    };
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.ready.then((registration) => {
        // Check for updates immediately
        void registration.update();
        intervalId = window.setInterval(() => {
          void registration.update();
        }, 20 * 60 * 1000);

        // Listen for new SW waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - show banner instead of auto-reload
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }
      }).catch(() => {
        // noop
      });

    document.addEventListener('visibilitychange', onVisibilityChange);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  // Fetch pending reschedule requests count for coaches
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (user && userProfile?.role === 'coach') {
        const count = await countPendingRescheduleRequests(user.id);
        setPendingRequests(count);
      } else {
        setPendingRequests(0);
      }
    };

    fetchPendingRequests();
    // Refresh count every 30 seconds while app is open
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user, userProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = (event: PopStateEvent) => {
      const fromState = (event.state && isView(event.state.view)) ? event.state.view : null;
      const fromPath = resolveViewFromPath(window.location.pathname);
      const targetView = fromState || fromPath;
      if (!targetView) return;

      const requiresClientContext = targetView === View.CLIENT_PROFILE
        || targetView === View.ASSESSMENT
        || targetView === View.SPORT_TRAINING;
      const requiresWorkoutContext = targetView === View.TRAINING_EXECUTION;

      if (requiresClientContext) {
        setSelectedClient(null);
      }
      if (requiresWorkoutContext) {
        setActiveWorkout(null);
      }

      historyPopRef.current = true;
      setCurrentView(targetView);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = buildNavigationUrl(currentView, selectedClient, activeWorkout);
    const state = { view: currentView };

    if (!historyInitializedRef.current) {
      window.history.replaceState(state, '', url);
      historyInitializedRef.current = true;
      previousViewRef.current = currentView;
      return;
    }

    if (historyPopRef.current) {
      historyPopRef.current = false;
      window.history.replaceState(state, '', url);
      previousViewRef.current = currentView;
      return;
    }

    if (previousViewRef.current !== currentView) {
      window.history.pushState(state, '', url);
      previousViewRef.current = currentView;
      return;
    }

    window.history.replaceState(state, '', url);
  }, [currentView, selectedClient?.id, activeWorkout?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user || user.isDemo) {
      setRouteHydrating(false);
      return;
    }

    setRouteHydrating(false);

    const fallbackView = resolvePostLoginView(userProfile, user);
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client');
    const workoutId = params.get('workout');

    const needsClientContext = currentView === View.CLIENT_PROFILE
      || currentView === View.ASSESSMENT
      || currentView === View.SPORT_TRAINING;
    const needsWorkoutContext = currentView === View.TRAINING_EXECUTION;

    let cancelled = false;

    const hydrate = async () => {
      if (needsClientContext && !selectedClient) {
        if (!clientId) {
          setCurrentView(fallbackView);
          return;
        }

        setRouteHydrating(true);
        const { fetchClientByIdForDeepLink } = await import('./services/navigation/deepLinkDataService');
        const resolvedClient = await fetchClientByIdForDeepLink(clientId);

        if (cancelled) return;
        setRouteHydrating(false);

        if (!resolvedClient) {
          setCurrentView(fallbackView);
          return;
        }

        setSelectedClient(resolvedClient);
      }

      if (needsWorkoutContext && !activeWorkout) {
        if (!workoutId) {
          setCurrentView(fallbackView);
          return;
        }

        setRouteHydrating(true);
        const { fetchWorkoutByIdForDeepLink, fetchClientByIdForDeepLink } = await import('./services/navigation/deepLinkDataService');
        const resolvedWorkout = await fetchWorkoutByIdForDeepLink(workoutId);

        if (cancelled) return;
        if (!resolvedWorkout) {
          setRouteHydrating(false);
          setCurrentView(fallbackView);
          return;
        }

        setActiveWorkout(resolvedWorkout);

        if (!selectedClient && resolvedWorkout.clientId) {
          const resolvedClient = await fetchClientByIdForDeepLink(resolvedWorkout.clientId);
          if (!cancelled && resolvedClient) {
            setSelectedClient(resolvedClient);
          }
        }

        if (!cancelled) {
          setRouteHydrating(false);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [currentView, selectedClient?.id, activeWorkout?.id, user?.id, user?.isDemo, userProfile?.role]);

  // Handle PWA update when user clicks the banner
  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

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
    setCurrentView(View.LOGIN);
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
        console.error('Error loading user profile:', error);
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

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setRecoveryError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsUpdatingPassword(true);
    setRecoveryError(null);
    try {
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setRecoveryError(error.message);
      } else {
        setShowRecoveryModal(false);
        setNewPassword('');
        // Remove hash from URL to prevent infinite loops on reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      setRecoveryError('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const renderRecoveryModal = (description: string) => {
    if (!showRecoveryModal) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
          <h2 className="text-xl font-black text-white mb-2 text-center">Definir Nova Senha</h2>
          <p className="text-sm text-slate-400 text-center mb-6">{description}</p>

          {recoveryError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs text-center font-medium">{recoveryError}</p>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Sua nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 outline-none transition-all font-medium"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Salvando...' : 'Salvar Senha'}
            </button>
          </div>
        </div>
      </div>
    );
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
          <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Protocolo Apex...</p>
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
        <LoginView onLogin={handleLoginSuccess} />
        {renderRecoveryModal('Digite sua nova senha de acesso abaixo.')}
      </div>
    );
  }

  // StudentView doesn't need the Layout dock
  if (currentView === View.STUDENT) {
    return renderWithBoundary(
      <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
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

      {renderRecoveryModal('Você está redefinindo sua senha de acesso. Digite a nova senha abaixo.')}
    </div>
  );
};

export default App;
