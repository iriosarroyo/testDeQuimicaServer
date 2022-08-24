"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAdminUid = exports.uidVerifiedUser = void 0;
const DDBB_1 = require("./DDBB");
const firebaseConfig_1 = require("./firebaseConfig");
/**
 *
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<string | undefined>} if it exists returns the uid of user, if it does not then it returns undefined.
 */
const uidVerifiedUser = async (tokenId) => {
    try {
        const { uid } = await firebaseConfig_1.mainAuth.verifyIdToken(tokenId);
        return uid;
    }
    catch {
        return undefined;
    }
};
exports.uidVerifiedUser = uidVerifiedUser;
const isAdminUid = async (uid) => {
    const [isAdministrator, error] = await (0, DDBB_1.readMainCache)(`users/${uid}/admin`);
    if (error !== undefined)
        return false;
    return Boolean(isAdministrator);
};
exports.isAdminUid = isAdminUid;
/**
 *
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<boolean>} if it is an admin or not.
 */
const isAdmin = async (tokenId) => {
    const uid = await (0, exports.uidVerifiedUser)(tokenId);
    if (uid === undefined)
        return false;
    return (0, exports.isAdminUid)(uid);
};
exports.isAdmin = isAdmin;
