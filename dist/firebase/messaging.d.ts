import { Topics } from "../interfaces/firebase";
import { Socket } from "socket.io";
export declare const manageToken: (uid: string, token: string, topics: Topics[]) => Promise<void>;
export declare const sendNotification: (title: string, body: string, topic: Topics) => Promise<import("firebase-admin/messaging").BatchResponse>;
export declare const getGroupByDBProp: (prop: string, value: any, secondProp?: any) => Promise<{
    completeName: string;
    uid: string;
    email: string | undefined;
}[]>;
export declare const getGroupAllUsers: () => Promise<{
    id: string;
    name: string;
    disabled: boolean;
    people: {
        completeName: string;
        uid: string;
        email: string | undefined;
    }[];
}>;
export declare const getGroupsFromDB: () => Promise<{
    people: ({
        completeName: string;
        uid: string;
        email: string | undefined;
    } | {
        email: string;
        uid: string;
    })[];
    name: string;
    id: string;
}[]>;
export declare const createGroup: (name: string) => Promise<string | null | undefined>;
export declare const copyGroup: (name: string, people: {
    [k: string]: string | boolean;
}) => Promise<string | null | undefined>;
export declare const deleteGroup: (id: string) => Promise<boolean>;
export declare const renameGroup: (id: string, newName: string) => Promise<boolean>;
export declare const addPersonToGroup: (id: string, uid: string, isEmail?: boolean) => Promise<string | boolean | null | undefined>;
export declare const removePersonFromGroup: (id: string, uid: string) => Promise<boolean>;
export declare const getAllGroups: () => Promise<({
    id: string;
    name: string;
    disabled: boolean;
    people: {
        completeName: string;
        uid: string;
        email: string | undefined;
    }[];
} | {
    people: ({
        completeName: string;
        uid: string;
        email: string | undefined;
    } | {
        email: string;
        uid: string;
    })[];
    name: string;
    id: string;
} | {
    people: {
        completeName: string;
        uid: string;
        email: string | undefined;
    }[];
    disabled: boolean;
    name: string;
    id: string;
} | {
    name: string;
    disabled: boolean;
    id: string;
    people: {
        completeName: string;
        uid: string;
        email: string | undefined;
    }[];
} | {
    name: string;
    disabled: boolean;
    id: string;
    people: {
        completeName: string;
        uid: string;
        email: string | undefined;
    }[];
})[]>;
export declare const sendEmail: (emails: string | string[], subject: string, html: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare const getStoredEmail: (uid: string) => any;
export declare const saveEmail: (socket: Socket, uid: string, { emails, groups, html, subject, users }: {
    groups?: string[] | undefined;
    users?: string[] | undefined;
    emails?: string[] | undefined;
    subject?: string | undefined;
    html?: string | undefined;
}) => void;
