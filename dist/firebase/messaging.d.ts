import { Topics } from "../interfaces/firebase";
export declare const manageToken: (token: string, topics: Topics[]) => Promise<void>;
export declare const sendNotification: (title: string, body: string, topic: "all" | "eso3" | "eso4" | "bach1" | "bach2") => Promise<import("firebase-admin/messaging").BatchResponse>;
