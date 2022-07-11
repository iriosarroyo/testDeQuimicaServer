import { Socket } from "socket.io";
import { isAdminUid, uidVerifiedUser } from "../firebase/authentification";
import { readMainCache, writeAdmin, writeMain } from "../firebase/DDBB";
import { manageToken, sendNotification } from "../firebase/messaging";
import { Topics } from "../interfaces/firebase";



const disconnect = (uid:string) =>{
    writeAdmin(`users/${uid}/connected`, false);
    writeAdmin(`users/${uid}/lastConnection`, Date.now());
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
}