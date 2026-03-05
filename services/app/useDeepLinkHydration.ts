import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { View, type Client, type Workout } from '../../types';
import { resolvePostLoginView, type AppSessionUser } from '../auth/authFlow';
import type { DBUserProfile } from '../userProfileService';

interface UseDeepLinkHydrationParams {
    currentView: View;
    selectedClient: Client | null;
    activeWorkout: Workout | null;
    user: AppSessionUser | null;
    userProfile: DBUserProfile | null;
    setCurrentView: Dispatch<SetStateAction<View>>;
    setSelectedClient: Dispatch<SetStateAction<Client | null>>;
    setActiveWorkout: Dispatch<SetStateAction<Workout | null>>;
    setRouteHydrating: Dispatch<SetStateAction<boolean>>;
}

export function useDeepLinkHydration({
    currentView,
    selectedClient,
    activeWorkout,
    user,
    userProfile,
    setCurrentView,
    setSelectedClient,
    setActiveWorkout,
    setRouteHydrating
}: UseDeepLinkHydrationParams): void {
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
                const { fetchClientByIdForDeepLink } = await import('../navigation/deepLinkDataService');
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
                const { fetchWorkoutByIdForDeepLink, fetchClientByIdForDeepLink } = await import('../navigation/deepLinkDataService');
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
    }, [
        activeWorkout,
        currentView,
        selectedClient,
        setActiveWorkout,
        setCurrentView,
        setRouteHydrating,
        setSelectedClient,
        user,
        userProfile
    ]);
}
