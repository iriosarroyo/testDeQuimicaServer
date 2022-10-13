import { ServiceAccount } from "firebase-admin";
export interface ExtendedServiceAccount extends ServiceAccount {
    [key: string]: string | undefined;
}
export interface Cache {
    [key: string]: {
        time: number;
        data: [any, Error | undefined];
    };
}
export declare type Topics = "all" | "eso3" | "eso4" | "bach1" | "bach2" | "test";
