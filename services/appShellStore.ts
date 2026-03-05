import { useSyncExternalStore, type SetStateAction } from 'react';
import { View, type Client, type Workout } from '../types';
import { resolveViewFromPath } from './navigation/historyNavigation';

interface AppShellState {
    currentView: View;
    selectedClient: Client | null;
    activeWorkout: Workout | null;
    routeHydrating: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();

function resolveInitialView(): View {
    if (typeof window === 'undefined') return View.LOGIN;
    return resolveViewFromPath(window.location.pathname) || View.LOGIN;
}

let state: AppShellState = {
    currentView: resolveInitialView(),
    selectedClient: null,
    activeWorkout: null,
    routeHydrating: false
};

function emit(): void {
    listeners.forEach((listener) => listener());
}

function getState(): AppShellState {
    return state;
}

function setState(next: Partial<AppShellState>): void {
    state = { ...state, ...next };
    emit();
}

function applyAction<T>(value: SetStateAction<T>, current: T): T {
    return typeof value === 'function'
        ? (value as (previous: T) => T)(current)
        : value;
}

export const appShellActions = {
    setCurrentView(value: SetStateAction<View>): void {
        setState({ currentView: applyAction(value, state.currentView) });
    },
    setSelectedClient(value: SetStateAction<Client | null>): void {
        setState({ selectedClient: applyAction(value, state.selectedClient) });
    },
    setActiveWorkout(value: SetStateAction<Workout | null>): void {
        setState({ activeWorkout: applyAction(value, state.activeWorkout) });
    },
    setRouteHydrating(value: SetStateAction<boolean>): void {
        setState({ routeHydrating: applyAction(value, state.routeHydrating) });
    },
    resetNavigation(): void {
        setState({
            currentView: View.LOGIN,
            selectedClient: null,
            activeWorkout: null,
            routeHydrating: false
        });
    }
};

export function useAppShellStore<T>(selector: (snapshot: AppShellState) => T): T {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => selector(getState()),
        () => selector(getState())
    );
}
