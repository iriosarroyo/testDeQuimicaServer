import { Database, Reference } from "firebase-admin/database";
import { Cache } from "../interfaces/firebase";
import { adminDB, mainDB } from "./firebaseConfig"


const readDDBB = (database:Database) =>{
    return async (path:string):Promise<[any, Error|undefined]> => {
        try{
            const snap = await database.ref(path).once("value");
            return [snap.val(), undefined]
        }catch(error){
            if(!(error instanceof Error)) return [undefined, undefined]
            return [undefined, error]
        }
    }
}


export const readMain = readDDBB(mainDB);
export const readAdmin = readDDBB(adminDB);

const MIN_TO_MS = 60000; // mins to milliseconds
/**
 * 
 * @param {Function} reader 
 */
const readCache = (reader:(path:string, ...params:any[]) => Promise<[any, Error|undefined]>) =>{
    const cache:Cache = {};
    /**
     * @param {string} path database path
     * @param {number} cacheTimer time in mins to expire cache data, 15 mins as default
     * @returns {Promise<[any, Error|undefined]>}
     */
    return async (path:string, cacheTimer = 15, ...params:any[]) =>{
        if(cache[path] !== undefined && cache[path].time + cacheTimer * MIN_TO_MS > Date.now()) return cache[path].data;
        const data = await reader(path, ...params);
        cache[path] = {data, time: Date.now()};
        return data;
    }
}

export const readMainCache = readCache(readMain);
export const readAdminCache = readCache(readAdmin);

const writeDDBB = (database:Database) =>{
    return async (path:string, value:any):Promise<Error|undefined> => {
        try{
            await database.ref(path).set(value);
        }catch(error){
            if((error instanceof Error)) return error
        }
        return undefined
    }
}



export const writeMain = writeDDBB(mainDB);
export const writeAdmin = writeDDBB(adminDB);

const pushDDBB = (database:Database) =>{
    return async (path:string, value:any):Promise<[Reference|undefined,Error|undefined]> => {
        try{
            const result = await database.ref(path).push(value);
            return [result, undefined]
        }catch(error){
            if((error instanceof Error)) return [undefined, error]
        }
        return [undefined, undefined]
    }
}



export const pushMain = pushDDBB(mainDB);
export const pushAdmin = pushDDBB(adminDB);

const inDDBB = (database:Database) =>{
    return async (path:string):Promise<[boolean|undefined, Error|undefined]> =>{
        try{
            const snap = await database.ref(path).once("value");
            return [snap.exists(), undefined]
        }catch(error){
            if(!(error instanceof Error)) return [undefined, undefined]
            return [undefined, error]
        }
    }
}
const addToDDBB = (database:Database) =>{
    return async (path:string, add:number = 1) =>{
        return database.ref(path).transaction((value:number|undefined) =>{
            if(value === undefined) return add;
            return value + add;
        })
    }
}
const queryChildEqualTo = (database:Database) =>{
    return async (path:string, child:string, equalTo:any, endAt?:any):Promise<[any, Error|undefined]> =>{
        try{
            let filter = database.ref(path).orderByChild(child)
            if(endAt !== undefined) filter = filter.startAt(equalTo).endAt(endAt)
            else filter = filter.equalTo(equalTo)
            const snap = await filter.once("value");
            return [snap.val(), undefined]
        }catch(error){
            if(!(error instanceof Error)) return [undefined, undefined]
            return [undefined, error]
        }
    }
}
export const filterAdmins =  readCache((path:string) => queryChildEqualTo(mainDB)(path, "admin", null, false));
export const queryChildEqualToMain =  queryChildEqualTo(mainDB);
export const inAdmin =  inDDBB(adminDB);
export const addToMain = addToDDBB(mainDB);
export const getUsers = ():Promise<{[k:string]:{name:string, surname:string, admin:boolean}}> => readMain("users").then(x => x[0])