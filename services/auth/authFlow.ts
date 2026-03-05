import { View, type AppUser, type UserProfile, type UserRole, isAdmin } from '../../types';

export type AppSessionUser = AppUser & {
    isDemo?: boolean;
    profile?: UserProfile;
};

export type NavigationIntent =
    | 'home'
    | 'student_home'
    | 'clients'
    | 'metrics'
    | 'settings'
    | 'calendar'
    | 'finance'
    | 'WORKOUT_BUILDER'
    | 'student'
    | 'student_workouts'
    | 'sport_training'
    | 'student_profile'
    | 'admin';

export function resolveUserRole(
    profile: Pick<UserProfile, 'role'> | null | undefined,
    user: Pick<AppUser, 'user_metadata' | 'profile'> | null | undefined
): UserRole {
    const role = profile?.role || user?.profile?.role || user?.user_metadata?.role;
    if (role === 'admin' || role === 'coach' || role === 'student') return role;
    return 'coach';
}

export function resolvePostLoginView(
    profile: Pick<UserProfile, 'role'> | null | undefined,
    user: Pick<AppUser, 'user_metadata' | 'profile'> | null | undefined
): View {
    return resolveUserRole(profile, user) === 'student' ? View.STUDENT : View.DASHBOARD;
}

export function resolveNavigationView(intent: NavigationIntent, role: UserRole): View | null {
    switch (intent) {
        case 'home':
            return role === 'student' ? View.STUDENT : View.DASHBOARD;
        case 'student_home':
        case 'student':
            return View.STUDENT;
        case 'clients':
            return View.CLIENTS;
        case 'metrics':
            return View.METRICS;
        case 'settings':
            return View.SETTINGS;
        case 'calendar':
            return View.CALENDAR;
        case 'finance':
            return View.FINANCE;
        case 'WORKOUT_BUILDER':
            return View.WORKOUT_BUILDER;
        case 'student_workouts':
            return View.STUDENT_WORKOUTS;
        case 'sport_training':
            return View.SPORT_TRAINING;
        case 'student_profile':
            return View.STUDENT_PROFILE;
        case 'admin':
            return View.ADMIN;
        default:
            return null;
    }
}

export function createDemoUser(): AppSessionUser & { isDemo: true } {
    return {
        id: 'demo-user-id',
        email: 'demo@apex.com',
        user_metadata: {
            name: 'Modo Demonstração',
            avatar_url: '',
            role: 'coach'
        },
        isDemo: true
    };
}

export function isDemoSessionUser(
    user: Pick<AppSessionUser, 'id' | 'isDemo'> | null | undefined
): boolean {
    return Boolean(user?.isDemo || user?.id === 'demo-user-id');
}

export function canAccessAdminArea(user: Pick<AppUser, 'user_metadata' | 'profile'> | null | undefined): boolean {
    return isAdmin(user as AppUser);
}

export function calculateLockDurationMs(failedAttempts: number): number | null {
    if (failedAttempts < 5) return null;
    return 30000 * Math.pow(2, failedAttempts - 5);
}

export function isLockedOut(lockUntil: number | null, nowMs: number = Date.now()): boolean {
    return lockUntil !== null && nowMs < lockUntil;
}

export function getRemainingLockSeconds(lockUntil: number | null, nowMs: number = Date.now()): number {
    if (!isLockedOut(lockUntil, nowMs)) return 0;
    return Math.ceil((lockUntil! - nowMs) / 1000);
}
