const PUSH_PREFS_STORAGE_KEY = 'apex_notifications';

interface NotificationPrefs {
    push: boolean;
    email: boolean;
    sms: boolean;
    promo: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window
    );
}

export function loadNotificationPrefs(): NotificationPrefs {
    if (typeof window === 'undefined') {
        return { push: false, email: false, sms: true, promo: false };
    }

    try {
        const raw = window.localStorage.getItem(PUSH_PREFS_STORAGE_KEY);
        if (!raw) return { push: false, email: false, sms: true, promo: false };
        const parsed = JSON.parse(raw);
        return {
            push: Boolean(parsed?.push),
            email: Boolean(parsed?.email),
            sms: Boolean(parsed?.sms),
            promo: Boolean(parsed?.promo)
        };
    } catch {
        return { push: false, email: false, sms: true, promo: false };
    }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PUSH_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // noop
    }
}

export async function subscribeToPushNotifications(): Promise<{
    success: boolean;
    message: string;
    subscription?: PushSubscription;
}> {
    if (!isPushSupported()) {
        return { success: false, message: 'Push não suportado neste dispositivo/navegador.' };
    }

    const vapidPublicKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPID_PUBLIC_KEY) || '';
    if (!vapidPublicKey) {
        return { success: false, message: 'VAPID public key não configurada.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return { success: false, message: 'Permissão de notificação negada.' };
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
        return { success: true, message: 'Push já estava ativo.', subscription: existing };
    }

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    return { success: true, message: 'Push ativado com sucesso.', subscription };
}

export async function unsubscribeFromPushNotifications(): Promise<{
    success: boolean;
    message: string;
}> {
    if (!isPushSupported()) {
        return { success: false, message: 'Push não suportado neste dispositivo/navegador.' };
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) {
        return { success: true, message: 'Push já estava desativado.' };
    }

    await existing.unsubscribe();
    return { success: true, message: 'Push desativado com sucesso.' };
}
