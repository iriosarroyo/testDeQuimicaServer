import { Socket } from "socket.io";
import { isAdminUid, uidVerifiedUser } from "../firebase/authentification";
import { addToMain, filterAdmins, queryChildEqualToMain, readMain, readMainCache, writeAdmin, writeMain } from "../firebase/DDBB";
import { mainDB } from "../firebase/firebaseConfig";
import { manageToken, sendNotification } from "../firebase/messaging";
import { Topics } from "../interfaces/firebase";
import logros from "../data/logros.json"
import { createFolder, deleteFile, deleteFolder, fileListener, renameFile, renameFolder } from "../firebase/storage";



const disconnect = (uid:string) =>{
    writeAdmin(`users/${uid}/connected`, false);
    writeAdmin(`users/${uid}/lastConnection`, Date.now());
}

const listenerWithUid = (socket:Socket, listener:string, cb:Function) =>{
    socket.on(listener, async (uid, ...params) =>{
        socket.emit(`${listener}:${uid}`, await cb(...params))
    })
}
export default async (socket:Socket) => {
    const { tokenId } = socket.handshake.auth
    const uid = await uidVerifiedUser(tokenId);
    if(uid === undefined) return socket.disconnect(true);
    writeAdmin(`users/${uid}/connected`, true);
    socket.on("disconnect", () => disconnect(uid))
    socket.on("ddbb:history", async() =>{
        socket.emit("ddbb:history", await readMainCache(`stats/${uid}/history`))
    })
    socket.on("firebase:messaging:token", (token:string, topics:Topics[]) =>{
        manageToken(token, topics);
    })
    socket.on("main:updateLogros", async (logroKey:string, logroData:{value:number, data?:any}|undefined, extraInfo:any) =>{
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
    if(!await isAdminUid(uid)) return undefined;
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
            const num = await mainDB.ref("preguntasTestDeQuimica").once("value").then(x => x.numChildren()) + 1;
            let id;
            if(num < 10) id = `id000${num}`;
            else if(num < 100) id = `id00${num}`;
            else if(num < 1000) id = `id0${num}`;
            else id = `id${num}`;
            socket.emit("nextId", id)
        }catch{}
    })

    socket.on("numOfPregs", async() =>{
        const num = await mainDB.ref("preguntasTestDeQuimica").once("value").then(x => x.numChildren());
        socket.emit("numOfPregs",num)
    })
    socket.on("write:main", async(path:string, val:any) =>{
        const result = await writeMain(path, val);
        if(result === undefined) socket.emit("write:main", val);
    })
    socket.on("main:pregunta", async (val:[string, any]) =>{
        const [id, preg] = val
        const result = await writeMain(`preguntasTestDeQuimica/${id}`, preg);
        if(result === undefined) socket.emit("main:pregunta", val);
    });
    socket.on("main:respuesta", async (val:[string, string]) =>{
        const [id, resp] = val
        const result = await writeMain(`respuestas/${id}`, resp);
        if(result === undefined) socket.emit("main:respuesta", val);
    });

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
        readMain("preguntasTestDeQuimica").then(x => x[0]),
        readMain("respuestas").then(x => x[0]),
    ]));
    listenerWithUid(socket, "main:mantenimiento",
     (state:boolean) =>writeMain('mantenimiento', state))
}