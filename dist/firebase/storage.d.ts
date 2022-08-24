import { Socket } from "socket.io";
export declare const createFolder: (path: string, name: string) => Promise<string | undefined>;
export declare const renameFolder: (prevPath: string, path: string, name: string) => Promise<string[] | undefined>;
export declare const renameFile: (path: string, name: string) => Promise<string | undefined>;
export declare const uploadFile: (name: string, file: ArrayBuffer) => Promise<string | undefined>;
export declare const deleteFile: (fullPath: string) => Promise<string | undefined>;
export declare const deleteFolder: (fullPath: string) => Promise<string | undefined>;
export declare const fileListener: (socket: Socket) => void;
