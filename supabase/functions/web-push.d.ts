declare module "npm:web-push@3.6.7" {
    interface PushSubscriptionLike {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }

    interface WebPushModule {
        setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
        sendNotification(subscription: PushSubscriptionLike, payload?: string): Promise<unknown>;
    }

    const webpush: WebPushModule;
    export default webpush;
}
