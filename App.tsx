import React, { useState, useEffect, Suspense, lazy } from 'react';
import { View, Client, Workout } from './types';
import { supabase, getUserProfile, countPendingRescheduleRequests, type DBUserProfile } from './services/supabaseClient';
import LoginView from './views/LoginView';
import Layout from './components/Layout';
import UpdateBanner from './components/UpdateBanner';
import {
  canAccessAdminArea,
  createDemoUser,
  resolveNavigationView,
  resolvePostLoginView,
  resolveUserRole,
  type AppSessionUser,
  type NavigationIntent
} from './services/auth/authFlow';

// Lazy load heavy views to reduce initial bundle size
const AIBuilderView = lazy(() => import('./views/AIBuilderView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const ClientProfileView = lazy(() => import('./views/ClientProfileView'));
const TrainingExecutionView = lazy(() => import('./views/TrainingExecutionView'));
const ClientsView = lazy(() => import('./views/ClientsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const CalendarView = lazy(() => import('./views/CalendarView'));
const MetricsView = lazy(() => import('./views/MetricsView'));
const FinanceView = lazy(() => import('./views/FinanceView'));
const WorkoutBuilderView = lazy(() => import('./views/WorkoutBuilderView'));
const AssessmentView = lazy(() => import('./views/AssessmentView'));
const StudentView = lazy(() => import('./views/StudentView'));
const SportTrainingView = lazy(() => import('./views/SportTrainingView'));
const AdminView = lazy(() => import('./views/AdminView'));
const AdminUsersView = lazy(() => import('./views/AdminUsersView'));
const AdminAILogsView = lazy(() => import('./views/AdminAILogsView'));
const AdminAIDashboardView = lazy(() => import('./views/AdminAIDashboardView'));
const AdminActivityLogsView = lazy(() => import('./views/AdminActivityLogsView'));
const AdminSettingsView = lazy(() => import('./views/AdminSettingsView'));
const StudentDashboardView = lazy(() => import('./views/StudentDashboardView'));
const StudentProfileView = lazy(() => import('./views/StudentProfileView'));
const StudentCalendarView = lazy(() => import('./views/StudentCalendarView'));

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
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<DBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);  // Reschedule requests count
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Password Recovery State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  // Service Worker update detection - show banner instead of auto-reload
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates immediately
        registration.update();

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
      });

      // Handle when SW takes control (after user clicks update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
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

  // Handle PWA update when user clicks the banner
  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage('skipWaiting');
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

      navigateTo(resolvePostLoginView(resolvedProfile, loggedUser));
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
      case View.METRICS: return 'metrics';
      case View.CALENDAR: return 'calendar';
      case View.FINANCE: return 'finance';
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
            onNavigate={handleNavigation}
          />
        );
      case View.AI_BUILDER:
        return <AIBuilderView user={user} onBack={() => navigateTo(View.DASHBOARD)} onDone={() => navigateTo(View.DASHBOARD)} />;
      case View.CLIENT_PROFILE:
        return <ClientProfileView
          client={selectedClient!}
          coachId={user?.id}
          onBack={() => navigateTo(View.DASHBOARD)}
          onStartWorkout={(workout) => navigateTo(View.TRAINING_EXECUTION, workout)}
          onStartAssessment={() => navigateTo(View.ASSESSMENT)}
          onCreateWorkout={() => navigateTo(View.WORKOUT_BUILDER)}
          onStudentView={() => navigateTo(View.STUDENT)}
          onSportTraining={() => navigateTo(View.SPORT_TRAINING)}
        />;
      case View.TRAINING_EXECUTION:
        return <TrainingExecutionView workout={activeWorkout!} onFinish={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />;
      case View.CLIENTS:
        return <ClientsView user={user} onBack={() => navigateTo(View.DASHBOARD)} onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)} />;
      case View.METRICS:
        return <MetricsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} />;
      case View.SETTINGS:
        return <SettingsView user={user} onBack={() => navigateTo(userProfile?.role === 'student' ? View.STUDENT : View.DASHBOARD)} onLogout={handleLogout} />;
      case View.CALENDAR:
        // Students see their own appointments with reschedule option
        if (userProfile?.role === 'student') {
          return <StudentCalendarView user={user} onBack={() => navigateTo(View.STUDENT)} />;
        }
        // Coaches see full calendar management
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
        // If user is actually a student (logged in student), show StudentDashboardView
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
        // Otherwise, this is a coach previewing student view for a client
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
        // Student viewing their workout list
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
            onSave={(workout) => {
              navigateTo(View.DASHBOARD);
            }}
          />
        );
      // Admin Views - Protected by role check
      case View.ADMIN:
      case View.ADMIN_USERS:
      case View.ADMIN_AI_LOGS:
      case View.ADMIN_AI_DASHBOARD:
      case View.ADMIN_ACTIVITY_LOGS:
      case View.ADMIN_SETTINGS:
        // Security: Verify admin permission before rendering any admin view
        if (!canAccessAdminArea(user)) {
          console.warn('🔒 Acesso negado: usuário não é admin');
          // Redirect to dashboard for non-admin users
          return (
            <DashboardView
              user={user}
              onSelectClient={(client) => navigateTo(View.CLIENT_PROFILE, client)}
              onOpenAI={() => navigateTo(View.AI_BUILDER)}
              onNavigate={handleNavigation}
            />
          );
        }
        // Render the appropriate admin view
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

  if (currentView === View.LOGIN) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-950">
        <LoginView onLogin={handleLoginSuccess} />

        {showRecoveryModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
              <h2 className="text-xl font-black text-white mb-2 text-center">Definir Nova Senha</h2>
              <p className="text-sm text-slate-400 text-center mb-6">
                Digite sua nova senha de acesso abaixo.
              </p>

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
        )}
      </div>
    );
  }

  // StudentView doesn't need the Layout dock
  if (currentView === View.STUDENT) {
    return (
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

  return (
    <div className="max-w-md mx-auto bg-slate-950 shadow-2xl min-h-screen overflow-hidden">
      {updateAvailable && (
        <UpdateBanner
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateAvailable(false)}
        />
      )}
      <Layout activeTab={getActiveTab()} onNavigate={handleNavigation} isStudent={userProfile?.role === 'student'} pendingRequests={pendingRequests}>
        <Suspense fallback={<ViewLoader />}>
          {renderContent()}
        </Suspense>
      </Layout>

      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
            <h2 className="text-xl font-black text-white mb-2 text-center">Definir Nova Senha</h2>
            <p className="text-sm text-slate-400 text-center mb-6">
              Você está redefinindo sua senha de acesso. Digite a nova senha abaixo.
            </p>

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
      )}
    </div>
  );
};

export default App;
