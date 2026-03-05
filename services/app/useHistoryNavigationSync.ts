import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { View, type Client, type Workout } from '../../types';
import {
    buildNavigationUrl,
    isView,
    resolveViewFromPath,
} from '../navigation/historyNavigation';

interface UseHistoryNavigationSyncParams {
    currentView: View;
    selectedClient: Client | null;
    activeWorkout: Workout | null;
    setCurrentView: Dispatch<SetStateAction<View>>;
    setSelectedClient: Dispatch<SetStateAction<Client | null>>;
    setActiveWorkout: Dispatch<SetStateAction<Workout | null>>;
}

export function useHistoryNavigationSync({
    currentView,
    selectedClient,
    activeWorkout,
    setCurrentView,
    setSelectedClient,
    setActiveWorkout
}: UseHistoryNavigationSyncParams): void {
    const historyInitializedRef = useRef(false);
    const previousViewRef = useRef<View>(View.LOGIN);
    const historyPopRef = useRef(false);

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
    }, [setActiveWorkout, setCurrentView, setSelectedClient]);

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
    }, [activeWorkout, currentView, selectedClient]);
}
