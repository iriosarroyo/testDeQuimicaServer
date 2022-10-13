import { Topics } from "../interfaces/firebase";
export declare const manageToken: (token: string, topics: Topics[]) => Promise<void>;
export declare const sendNotification: (title: string, body: string, topic: Topics) => Promise<import("firebase-admin/messaging").BatchResponse>;
