import { Database, Reference } from "firebase-admin/database";
import { Socket } from "socket.io";
import { Cache } from "../interfaces/firebase";
import { PreguntaTest } from "../interfaces/preguntas";
import { globalSocket } from "../socket";
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

const PATH_DATOS_CURIOSOS = "inicio/datosCuriosos"
const PATH_ACTIVE_DATOS_CURIOSOS = "inicio/activeDatosCuriosos"
const timeout_table:{[k:string]:NodeJS.Timeout} = {}
const editing_table:{[k:string]:string|undefined} = new Proxy({} as {[k:string|symbol]:string}, {set(target, prop, value) {
    target[prop] = value
    globalSocket.emit("datosCuriosos:editing", target)
    return true
},})
export const editDatoCurioso = (key:string, val:string, username:string) => {
    if(key in timeout_table) clearTimeout(timeout_table[key])
    if(editing_table[key] !== username) editing_table[key] =  username
    writeMain(`${PATH_DATOS_CURIOSOS}/${key}`, val)
    setTimeout(() => {editing_table[key] = undefined}, 15000)
}
export const newDatoCurioso = () => pushMain(PATH_DATOS_CURIOSOS, "")
export const deleteDatoCurioso = (key:string) => writeMain(`${PATH_DATOS_CURIOSOS}/${key}`, null)
export const activeDatosCuriosos = (val:boolean) => writeMain(PATH_ACTIVE_DATOS_CURIOSOS, val)
export const getAllUids = async () =>{
    const [res] = await readMain('users');
    return Object.keys(res ?? {});
}

let preguntas:{[k:string]:PreguntaTest};
let respuestas:{[k:string]:string}
const timeoutsPregs: { [k: string]: NodeJS.Timeout; } = {}
const countsPregs: { [x: string]: number; } = {}

export const getPreguntas = async () =>{
    if(!preguntas) preguntas = (await readMain('preguntas'))[0] ?? {}
    return preguntas
}
export const getRespuestas = async () =>{
    if(!respuestas) respuestas = (await readMain('respuestas'))[0] ?? {}
    return respuestas
}

export const savePregunta = (socket:Socket, id:string, pregunta:PreguntaTest, respuesta:string, newQ?:boolean) =>{
    if(!preguntas) preguntas = {}
    if(!respuestas) respuestas = {}
    preguntas[id] = pregunta
    respuestas[id] = respuesta
    globalSocket.emit('preguntas:edit', socket.id, id, pregunta, respuesta, newQ)
    const thisCount =(countsPregs[id] ?? 0) +  1 
    countsPregs[id] = thisCount
    const write = () =>{
        writeMain(`preguntas/${id}`, pregunta)
        writeMain(`respuestas/${id}`, respuesta)
    }
    if(thisCount % 200 === 0 || newQ) write();
    clearTimeout(timeoutsPregs[id])
    timeoutsPregs[id] = setTimeout(write, 15000)
}

const getNextId = () => {
    const idNums = Object.keys(preguntas).map(x => parseInt(x.slice(2)))
    const maxId = Math.max(...idNums)
    const strId = `000${maxId}`.slice(-4)
    return `id${strId}`
}

const newQuestion = (socket:Socket) =>{
    const id = getNextId()
    savePregunta(socket, id, {
        pregunta: "",
        done: false,
        id,
        level:"1",
        nivelYTema:"tema1_1",
        opciones: {},
        tema: 'tema1',
        year: ""
    }, "", true)
    return id
}