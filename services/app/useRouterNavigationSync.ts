import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { View, type Client, type Workout } from '../../types';
import {
    buildNavigationUrl,
    resolveViewFromPath,
} from '../navigation/historyNavigation';

interface UseRouterNavigationSyncParams {
    currentView: View;
    selectedClient: Client | null;
    activeWorkout: Workout | null;
    setCurrentView: Dispatch<SetStateAction<View>>;
    setSelectedClient: Dispatch<SetStateAction<Client | null>>;
    setActiveWorkout: Dispatch<SetStateAction<Workout | null>>;
}

function normalizeUrl(pathname: string, search: string): string {
    return `${pathname}${search || ''}`;
}

export function useRouterNavigationSync({
    currentView,
    selectedClient,
    activeWorkout,
    setCurrentView,
    setSelectedClient,
    setActiveWorkout
}: UseRouterNavigationSyncParams): void {
    const location = useLocation();
    const navigate = useNavigate();
    const lastSyncedUrlRef = useRef<string>('');
    const previousViewRef = useRef<View>(currentView);
    const initializedRef = useRef(false);

    useEffect(() => {
        const currentUrl = normalizeUrl(location.pathname, location.search);
        lastSyncedUrlRef.current = currentUrl;

        const targetView = resolveViewFromPath(location.pathname);
        if (!targetView) return;

        const requiresClientContext = targetView === View.CLIENT_PROFILE
            || targetView === View.ASSESSMENT
            || targetView === View.SPORT_TRAINING;
        const requiresWorkoutContext = targetView === View.TRAINING_EXECUTION;
        const params = new URLSearchParams(location.search);

        if (requiresClientContext && !params.get('client')) {
            setSelectedClient(null);
        }
        if (requiresWorkoutContext && !params.get('workout')) {
            setActiveWorkout(null);
        }

        setCurrentView((previous) => previous === targetView ? previous : targetView);
    }, [
        location.pathname,
        location.search,
        setActiveWorkout,
        setCurrentView,
        setSelectedClient
    ]);

    useEffect(() => {
        const nextUrl = buildNavigationUrl(currentView, selectedClient, activeWorkout);
        const currentUrl = normalizeUrl(location.pathname, location.search);

        if (!initializedRef.current) {
            initializedRef.current = true;
            previousViewRef.current = currentView;
            if (currentUrl !== nextUrl) {
                lastSyncedUrlRef.current = nextUrl;
                navigate(nextUrl, { replace: true });
            }
            return;
        }

        if (lastSyncedUrlRef.current === nextUrl || currentUrl === nextUrl) {
            previousViewRef.current = currentView;
            return;
        }

        const replace = previousViewRef.current === currentView;
        previousViewRef.current = currentView;
        lastSyncedUrlRef.current = nextUrl;
        navigate(nextUrl, { replace });
    }, [
        activeWorkout,
        currentView,
        location.pathname,
        location.search,
        navigate,
        selectedClient
    ]);
}
