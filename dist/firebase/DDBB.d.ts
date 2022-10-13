import { Reference } from "firebase-admin/database";
export declare const readMain: (path: string) => Promise<[any, Error | undefined]>;
export declare const readAdmin: (path: string) => Promise<[any, Error | undefined]>;
export declare const readMainCache: (path: string, cacheTimer?: number, ...params: any[]) => Promise<[any, Error | undefined]>;
export declare const readAdminCache: (path: string, cacheTimer?: number, ...params: any[]) => Promise<[any, Error | undefined]>;
export declare const writeMain: (path: string, value: any) => Promise<Error | undefined>;
export declare const writeAdmin: (path: string, value: any) => Promise<Error | undefined>;
export declare const pushMain: (path: string, value: any) => Promise<[Reference | undefined, Error | undefined]>;
export declare const pushAdmin: (path: string, value: any) => Promise<[Reference | undefined, Error | undefined]>;
export declare const filterAdmins: (path: string, cacheTimer?: number, ...params: any[]) => Promise<[any, Error | undefined]>;
export declare const queryChildEqualToMain: (path: string, child: string, equalTo: any, endAt?: any) => Promise<[any, Error | undefined]>;
export declare const inAdmin: (path: string) => Promise<[boolean | undefined, Error | undefined]>;
export declare const addToMain: (path: string, add?: number) => Promise<import("@firebase/database-types").TransactionResult>;
export declare const getUsers: () => Promise<{
    [k: string]: {
        name: string;
        surname: string;
        admin: boolean;
    };
}>;
export declare const editDatoCurioso: (key: string, val: string, username: string) => void;
export declare const newDatoCurioso: () => Promise<[Reference | undefined, Error | undefined]>;
export declare const deleteDatoCurioso: (key: string) => Promise<Error | undefined>;
export declare const activeDatosCuriosos: (val: boolean) => Promise<Error | undefined>;
