import { readMainCache } from "./DDBB";
import { mainAuth } from "./firebaseConfig"

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