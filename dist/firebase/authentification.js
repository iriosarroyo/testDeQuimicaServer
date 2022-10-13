"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersListener = exports.isAdmin = exports.isEditorUid = exports.isAdminUid = exports.uidVerifiedUser = void 0;
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
const isEditorUid = async (uid) => {
    const [isAdministrator, error] = await (0, DDBB_1.readMainCache)(`users/${uid}/editor`);
    if (error !== undefined)
        return false;
    return Boolean(isAdministrator);
};
exports.isEditorUid = isEditorUid;
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
const getAllUsersListener = (socket, uid) => {
    let usersMain = undefined;
    let usersAdmin = undefined;
    const returnUsers = async () => {
        if (usersAdmin === undefined || usersMain === undefined)
            return;
        const usersAuth = await firebaseConfig_1.mainAuth.listUsers();
        const usersEntries = usersAuth.users.map(user => {
            const { uid } = user;
            if (usersMain?.[uid] === undefined || usersAdmin?.[uid] === undefined)
                return [uid, undefined];
            return [uid, { ...user, userDDBB: {
                        ...usersMain[uid],
                        ...usersAdmin[uid]
                    } }];
        }).filter(elem => elem[1] !== undefined);
        socket.emit(`allUsersData:${uid}`, Object.fromEntries(usersEntries));
    };
    const onMainChange = (data) => {
        usersMain = data.val();
        returnUsers();
    };
    const onAdminChange = (data) => {
        usersAdmin = data.val();
        returnUsers();
    };
    firebaseConfig_1.mainDB.ref('users').on("value", onMainChange);
    firebaseConfig_1.adminDB.ref('users').on("value", onAdminChange);
    socket.once(`disconnect:${uid}`, () => {
        firebaseConfig_1.mainDB.ref('users').off("value", onMainChange);
        firebaseConfig_1.mainDB.ref('users').off("value", onAdminChange);
    });
};
exports.getAllUsersListener = getAllUsersListener;
