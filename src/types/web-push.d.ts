declare module "web-push" {
  export type PushSubscription = {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  export type SendOptions = {
    TTL?: number;
  };

  export type VapidKeys = {
    publicKey: string;
    privateKey: string;
  };

  export interface WebPushApi {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: PushSubscription, payload?: string | Buffer, options?: SendOptions): Promise<unknown>;
    generateVAPIDKeys(): VapidKeys;
  }

  const webpush: WebPushApi;
  export default webpush;
}
