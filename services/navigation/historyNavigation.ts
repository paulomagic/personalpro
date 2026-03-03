import { View, type Client, type Workout } from '../../types';

const VIEW_TO_PATH: Record<View, string> = {
    [View.LOGIN]: '/',
    [View.DASHBOARD]: '/dashboard',
    [View.AI_BUILDER]: '/ai-builder',
    [View.CLIENT_PROFILE]: '/clients/profile',
    [View.CLIENT_DETAIL]: '/clients/detail',
    [View.TRAINING_EXECUTION]: '/training/execution',
    [View.CALENDAR]: '/calendar',
    [View.CLIENTS]: '/clients',
    [View.METRICS]: '/metrics',
    [View.SETTINGS]: '/settings',
    [View.FINANCE]: '/finance',
    [View.WORKOUT_BUILDER]: '/workout-builder',
    [View.ASSESSMENT]: '/assessment',
    [View.STUDENT]: '/student',
    [View.STUDENT_PROFILE]: '/student/profile',
    [View.STUDENT_WORKOUTS]: '/student/workouts',
    [View.SPORT_TRAINING]: '/sport-training',
    [View.ADMIN]: '/admin',
    [View.ADMIN_USERS]: '/admin/users',
    [View.ADMIN_AI_LOGS]: '/admin/ai-logs',
    [View.ADMIN_AI_DASHBOARD]: '/admin/ai-dashboard',
    [View.ADMIN_ACTIVITY_LOGS]: '/admin/activity-logs',
    [View.ADMIN_SETTINGS]: '/admin/settings',
};

const PATH_TO_VIEW = Object.entries(VIEW_TO_PATH).reduce<Record<string, View>>((acc, [view, path]) => {
    acc[path] = view as View;
    return acc;
}, {});

function normalizePath(pathname: string): string {
    if (!pathname) return '/';
    const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    return withoutTrailingSlash || '/';
}

export function isView(value: unknown): value is View {
    return typeof value === 'string' && value in VIEW_TO_PATH;
}

export function resolvePathFromView(view: View): string {
    return VIEW_TO_PATH[view] || '/';
}

export function resolveViewFromPath(pathname: string): View | null {
    const normalized = normalizePath(pathname);
    return PATH_TO_VIEW[normalized] || null;
}

export function buildNavigationUrl(
    view: View,
    selectedClient: Client | null,
    activeWorkout: Workout | null
): string {
    const path = resolvePathFromView(view);
    const params = new URLSearchParams();

    if ((view === View.CLIENT_PROFILE || view === View.ASSESSMENT || view === View.SPORT_TRAINING) && selectedClient?.id) {
        params.set('client', selectedClient.id);
    }
    if (view === View.TRAINING_EXECUTION && activeWorkout?.id) {
        params.set('workout', activeWorkout.id);
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

