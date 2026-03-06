import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

interface UseServiceWorkerUpdatesResult {
    updateAvailable: boolean;
    setUpdateAvailable: Dispatch<SetStateAction<boolean>>;
    handleUpdate: () => void;
}

export function useServiceWorkerUpdates(): UseServiceWorkerUpdatesResult {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const shouldReloadOnControllerChangeRef = useRef(false);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

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
            if (!shouldReloadOnControllerChangeRef.current) {
                return;
            }

            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        };

        navigator.serviceWorker.ready.then((registration) => {
            void registration.update();
            intervalId = window.setInterval(() => {
                void registration.update();
            }, 20 * 60 * 1000);

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setWaitingWorker(newWorker);
                            setUpdateAvailable(true);
                        }
                    });
                }
            });

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

    const handleUpdate = () => {
        if (waitingWorker) {
            shouldReloadOnControllerChangeRef.current = true;
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    return {
        updateAvailable,
        setUpdateAvailable,
        handleUpdate
    };
}
