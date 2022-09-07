import { UserRecord } from "firebase-admin/auth";
import { DataSnapshot } from "firebase-admin/database";
import { Socket } from "socket.io";
import { readMainCache } from "./DDBB";
import { adminDB, mainAuth, mainDB } from "./firebaseConfig"

/**
 * 
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<string | undefined>} if it exists returns the uid of user, if it does not then it returns undefined.
 */
export const uidVerifiedUser = async (tokenId:string) =>{
    try{
        const { uid } = await mainAuth.verifyIdToken(tokenId)
        return uid;
    }catch{
        return undefined;
    }
}

export const isAdminUid = async (uid:string) => {
    const [isAdministrator, error] = await readMainCache(`users/${uid}/admin`);
    if(error !== undefined) return false;
    return Boolean(isAdministrator);
}
/**
 * 
 * @param {string} tokenId id token from firebase user.
 * @returns {Promise<boolean>} if it is an admin or not.
 */
export const isAdmin = async (tokenId:string) => {
    const uid = await uidVerifiedUser(tokenId);
    if(uid === undefined) return false;
    return isAdminUid(uid);
}

interface MyUser extends UserRecord{
    userDDBB:{}
}
export const getAllUsersListener = (socket:Socket, uid:string) =>{
    let usersMain:{[k:string]:({}|undefined)}|undefined = undefined;
    let usersAdmin:{[k:string]:({}|undefined)}|undefined = undefined;
    const returnUsers = async () =>{
        if(usersAdmin === undefined || usersMain === undefined) return;
        const usersAuth = await mainAuth.listUsers();
        const usersEntries = usersAuth.users.map(user =>{
            const {uid} = user
            if(usersMain?.[uid] === undefined || usersAdmin?.[uid] === undefined) return [uid, undefined];
            return [uid, {...user, userDDBB:{
                ...usersMain[uid],
                ...usersAdmin[uid]
            }}]
        }).filter(elem => elem[1] !== undefined)
        socket.emit(`allUsersData:${uid}`, Object.fromEntries(usersEntries))
    }
    const onMainChange = (data:DataSnapshot) =>{
        usersMain = data.val();
        returnUsers();
    }
    const onAdminChange = (data:DataSnapshot) =>{
        usersAdmin = data.val();
        returnUsers();
    }
    mainDB.ref('users').on("value", onMainChange)
    adminDB.ref('users').on("value", onAdminChange)

    socket.once(`disconnect:${uid}`, () =>{
        mainDB.ref('users').off("value", onMainChange)
        mainDB.ref('users').off("value", onAdminChange)
    })

}