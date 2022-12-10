import { Server, Socket } from "socket.io";
import { getAllUsersListener, isAdminUid, isEditorUid, uidVerifiedUser } from "../firebase/authentification";
import { activeDatosCuriosos, addToMain, deleteDatoCurioso, editDatoCurioso, filterAdmins, getAllUids, newDatoCurioso, pushAdmin, queryChildEqualToMain, readMain, readMainCache, writeAdmin, writeMain } from "../firebase/DDBB";
import { mainDB } from "../firebase/firebaseConfig";
import { addPersonToGroup, copyGroup, createGroup, deleteGroup, getAllGroups, getStoredEmail, manageToken, removePersonFromGroup, renameGroup, saveEmail, sendEmail, sendNotification } from "../firebase/messaging";
import { Topics } from "../interfaces/firebase";
import logros from "../data/logros.json"
import { createFolder, deleteFile, deleteFolder, fileListener, renameFile, renameFolder } from "../firebase/storage";
import getUid from "../tools/uid";
import saveStats, { getAllStats } from "../stats";
import { StatsData } from "../interfaces/stats";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { PATHS_DDBB, PATHS_SCKT } from "../data/paths";

const peopleConnected:{[k:string]:{[k2:string]:Socket|undefined}|undefined} = {};
const connectionStart:{[k:string]:number|undefined} = {}

const connect = (uid:string, idConnection:string, socket:Socket) =>{
    if(peopleConnected[uid] === undefined) {
        peopleConnected[uid] = {[idConnection]:socket};
        connectionStart[uid] = Date.now();
        writeAdmin(`users/${uid}/connected`, true);
    }
    else peopleConnected[uid] = {...peopleConnected[uid] ?? {}, [idConnection]:socket}
}

const disconnect = (uid:string, idConnection:string) =>{
    delete peopleConnected[uid]?.[idConnection] 
    if(peopleConnected[uid] === undefined || Object.keys(peopleConnected[uid] ?? {}).length === 0){
        peopleConnected[uid] = undefined;
        const timeConnected = Date.now() - (connectionStart[uid] ?? Date.now())
        pushAdmin('connectionTime', {
            date: connectionStart[uid],
            timeConnected,
            uid
        })
        writeAdmin(`users/${uid}/connected`, false);
        writeAdmin(`users/${uid}/lastConnection`, Date.now());
    }
}

const listenerWithUid = (socket:Socket, listener:string, cb:Function) =>{
    socket.on(listener, async (uid, ...params) =>{
        const res = await cb(...params)
        socket.emit(`${listener}:${uid}`, res)
    })
}

const execOnUser = (user:string, cb: (s:Socket|undefined) => any) =>{
    Object.values(peopleConnected[user] ?? {}).forEach(cb)
}

const execToAllUsers = (cb: (s:Socket|undefined) => any) =>{
    Object.values(peopleConnected).forEach((user) =>{
        Object.values(user ?? {}).forEach(cb)
    })
}
export default async (socket:Socket) => {
    const { tokenId } = socket.handshake.auth
    const uid = await uidVerifiedUser(tokenId);
    if(uid === undefined) return socket.disconnect(true);
    const idConnection = getUid();
    connect(uid, idConnection, socket);
    socket.on("disconnect", () => disconnect(uid, idConnection))
    socket.on("disconnectUser", () => socket.disconnect()) // just for testing purpose
    socket.on(PATHS_SCKT.ddbbHistory, async() =>{
        socket.emit(PATHS_SCKT.ddbbHistory, await readMainCache(`stats/${uid}/history`))
    })
    socket.on(PATHS_SCKT.messagingToken, (token:string, topics:Topics[]) =>{
        manageToken(uid, token, topics);
    })
    listenerWithUid(socket, PATHS_SCKT.userStats, (start?:number, end?:number) => getAllStats(start, end, uid))
    socket.on(PATHS_SCKT.updateLogros, async (logroKey:string, logroData:{value:number, data?:any}|undefined, extraInfo:any) =>{
        let result, newValue:number, val:number;
        if(logroKey === "testDeHoySeguidos"){
            //extraInfo must be todays day in number
            if(typeof extraInfo !== "number") return;
            const {value, data} = logroData ?? {value: 0, data:{currStreak: 0, lastDay: 0}};
            const {currStreak, lastDay} = data as {currStreak:number, lastDay:number}
            const newStreak = extraInfo === lastDay + 1 ? currStreak + 1 : 1;
            newValue = Math.max(value, newStreak);
            val = value;
            result = await writeMain(`users/${uid}/logros/${logroKey}`, {
                value: newValue,
                data:{
                    currStreak: newStreak,
                    lastDay: extraInfo
                }
            });
        }else if(logroKey === "numberOf10"){
            const {value, data} = logroData ?? {value: 0, data:{}}
            val = value;
            const puntsTemas = extraInfo
            const hasEverHadA10 = Object.entries(puntsTemas).map(([k, v]) => ([k, v === 10 || Boolean(data[k])]))
            const newData = Object.fromEntries(hasEverHadA10);
            newValue = hasEverHadA10.filter(([, v]) => v).length
            result = await writeMain(`users/${uid}/logros/${logroKey}`, {
                value: newValue,
                data: newData
            });
        }else{
            if(logroKey === "preguntasDone" && typeof extraInfo !== "number") return;
            const valueToAdd = logroKey === "preguntasDone" ? Number(extraInfo) : 1;
            const {value} = logroData ?? {value:0};
            val = value;
            newValue = value + valueToAdd;
            result = await writeMain(`users/${uid}/logros/${logroKey}/value`, newValue);
        }
        const logroConseguido = val === newValue ?  undefined 
            : Object.values(logros).find(logro => (logro.key === logroKey && newValue === logro.value))
        const resultStars = logroConseguido && await addToMain(`users/${uid}/stars`, logroConseguido.stars);
        if(logroConseguido !== undefined) socket.emit("onLogroCompletion", logroConseguido.id);
        if(result === undefined && resultStars === undefined) socket.emit("main:respuesta", logroKey);
    });
    socket.on('main:starsFromAllUsers', async() =>{
        const [users, error] = await filterAdmins("users");
        if(error) return socket.emit("main:starsFromAllUsers", null)
        const result = Object.values(users ?? {}).map((user) =>{
            const x = user as {stars:number, username:string}
            return {stars: x.stars ?? 0, username: x.username ?? "Anónimo"}
        })
        socket.emit("main:starsFromAllUsers", result)
    })
    socket.on('main:getLogrosFromUser', async(user:string) =>{
        const [userdata, error] = await queryChildEqualToMain('users', 'username', user);
        if(error) return socket.emit("main:getLogrosFromUser", {})
        const {logros} = Object.values((userdata as {k:{
            logros:{}
        }})?? {})[0] ?? {}
        return socket.emit("main:getLogrosFromUser", logros ?? {})
    })
    listenerWithUid(socket, "user:isAdmin", () => isAdminUid(uid))
    listenerWithUid(socket, "sendStatsForAdmin", (data:StatsData) => saveStats(data, uid))
    
    const isAdmin = await isAdminUid(uid);
    listenerWithUid(socket, "main:deleteUserFromDDBB", async(id:string) =>{
        if(id !== uid && !isAdmin) return;
        const result = await writeMain(`users/${uid}`, null);
        return result === undefined;
    });
    listenerWithUid(socket, "main:isUsernameInDDBB", async(username:string) =>{
        const [users, error] = await readMain("users");
        if(error) return true;
        return Object.values((users ?? {}) as {[k:string]:{username:string}}).some(x => x.username === username);
    })
    const isEditor = isAdmin || await isEditorUid(uid);
    if(!isEditor) return undefined;
    socket.on("main:pregunta", async (val:[string, any]) =>{
        const [id, preg] = val
        const result = await writeMain(`${PATHS_DDBB.preguntas}/${id}`, preg);
        if(result === undefined) socket.emit("main:pregunta", val);
    });
    socket.on("main:respuesta", async (val:[string, string]) =>{
        const [id, resp] = val
        const result = await writeMain(`respuestas/${id}`, resp);
        if(result === undefined) socket.emit("main:respuesta", val);
    });
    if(!isAdmin) return undefined;
    socket.on("firebase:messaging:notification", async(title:string, body:string, topic:Topics) =>{
        try{
            await sendNotification(title, body, topic);
            socket.emit("firebase:messaging:notification", true);
        }catch{
            socket.emit("firebase:messaging:notification", false);
        }

    })
    socket.on("main:inicio:content", async (val:string) =>{
        const result = await writeMain("/inicio/opciones/inicio003/content", val);
        if(result === undefined) socket.emit("main:inicio:content", val)
    })
    socket.on("read:main:respuestas", async (id:string) =>{
        const [result, error] = await readMainCache(`respuestas/${id}`, 0.01);
        if(error === undefined) socket.emit("read:main:respuestas", result);
    })
    socket.on("nextId", async() =>{
        try{
            const num = await mainDB.ref(PATHS_DDBB.preguntas).once("value").then((x:any) => x.numChildren()) + 1;
            let id;
            if(num < 10) id = `id000${num}`;
            else if(num < 100) id = `id00${num}`;
            else if(num < 1000) id = `id0${num}`;
            else id = `id${num}`;
            socket.emit("nextId", id)
        }catch{}
    })

    socket.on("numOfPregs", async() =>{
        const num = await mainDB.ref(PATHS_DDBB.preguntas).once("value").then((x:any) => x.numChildren());
        socket.emit("numOfPregs",num)
    })
    socket.on("write:main", async(path:string, val:any) =>{
        const result = await writeMain(path, val);
        if(result === undefined) socket.emit("write:main", val);
    })
    

    socket.on("documents:renameFile", async(path:string, name:string) =>{
        socket.emit("documents:renameFile", await renameFile(path, name))
    })
    socket.on("documents:createFolder", async(path:string, name:string) =>{
        socket.emit("documents:createFolder", await createFolder(path, name))
    })

    fileListener(socket);
    listenerWithUid(socket, "documents:renameFolder", renameFolder);
    listenerWithUid(socket, "documents:deleteFolder", deleteFolder);
    listenerWithUid(socket, "documents:deleteFile", deleteFile);
    listenerWithUid(socket, "main:allQuestions", () =>Promise.all([
        readMain(PATHS_DDBB.preguntas).then(x => x[0]),
        readMain("respuestas").then(x => x[0]),
    ]));

    listenerWithUid(socket, "users:editData", (uid:string, val:string, path:string) =>{
        return writeMain(`users/${uid}/${path}`, val)
    })

    
    listenerWithUid(socket, "main:mantenimiento",
     (state:boolean) =>writeMain('mantenimiento', state))

    socket.on("allUsersData", (uid:string) => getAllUsersListener(socket, uid))
    listenerWithUid(socket, "stats:allStats", (start?:number, end?:number, id?:string) => getAllStats(start, end, id))
    listenerWithUid(socket, "datoCurioso:edit", editDatoCurioso);
    listenerWithUid(socket, "datoCurioso:new", newDatoCurioso);
    listenerWithUid(socket, "datoCurioso:delete", deleteDatoCurioso);
    listenerWithUid(socket, "datosCuriosos:active", activeDatosCuriosos);
    listenerWithUid(socket, "admin:disconnectUser", (user:string) => execOnUser(user, (s) => s?.disconnect()))
    listenerWithUid(socket, "admin:reloadUser", (user:string) => execOnUser(user, (s) => s?.emit("admin:reload")))
    listenerWithUid(socket, "admin:disconnectAllUsers", () => execToAllUsers((s) => s?.disconnect()))
    listenerWithUid(socket, "admin:reloadAllUsers", () => execToAllUsers((s) => s?.emit("admin:reload")))
    listenerWithUid(socket, "admin:allUids", getAllUids)
    listenerWithUid(socket, "notification:getAllGroups", getAllGroups)
    listenerWithUid(socket, "notification:addPersonToGroup", addPersonToGroup)
    listenerWithUid(socket, "notification:removePersonFromGroup", removePersonFromGroup)
    listenerWithUid(socket, "notification:createGroup", createGroup)
    listenerWithUid(socket, "notification:deleteGroup", deleteGroup)
    listenerWithUid(socket, "notification:copyGroup", copyGroup)
    listenerWithUid(socket, "notification:renameGroup", renameGroup)
    listenerWithUid(socket, "notification:sendEmail", sendEmail)
    listenerWithUid(socket, "notification:getStoredEmail", ()=> getStoredEmail(uid))
    listenerWithUid(socket, "notification:saveEmail",(data:{}) => saveEmail(socket, uid, data))
}

export let globalSocket:Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
export const setGlobalSocket =(val:Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => globalSocket = val