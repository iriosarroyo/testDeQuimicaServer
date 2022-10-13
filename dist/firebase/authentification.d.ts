import { Socket } from "socket.io";
/**
 *
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<string | undefined>} if it exists returns the uid of user, if it does not then it returns undefined.
 */
export declare const uidVerifiedUser: (tokenId: string) => Promise<string | undefined>;
export declare const isAdminUid: (uid: string) => Promise<boolean>;
export declare const isEditorUid: (uid: string) => Promise<boolean>;
/**
 *
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<boolean>} if it is an admin or not.
 */
export declare const isAdmin: (tokenId: string) => Promise<boolean>;
export declare const getAllUsersListener: (socket: Socket, uid: string) => void;
