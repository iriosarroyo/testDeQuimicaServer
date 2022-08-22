import { Socket } from "socket.io";
import getUid from "../tools/uid";
import { mainBucket } from "./firebaseConfig"

export const createFolder = async (path:string, name:string) =>{
    const folderPath = `${path}/${name}/`;
    try{
        await mainBucket.file(folderPath).save('');
        return folderPath;
    }catch(e){
        console.log(e)
        return undefined;
    }
}

export const renameFolder = async(prevPath:string, path:string, name:string) => {
    const previousPath = (prevPath.endsWith("/") ? prevPath : `${prevPath}/`).replace(/^\//, '')
    const folderPath = `${path}/${name}/`;
    try{
        const [files] = await mainBucket.getFiles({prefix: previousPath});
        await Promise.all(files.map(file => file.move(file.name.replace(previousPath, folderPath))))
        return [previousPath, folderPath];
    }catch(e){
        console.log(e)
        return undefined
    }
}

export const renameFile = async (path:string, name:string) => {
    const newPath = path.replace(/(\/[^\/]+)$/, `/${name}`);
    try{
        await mainBucket.file(path).rename(newPath);
        return newPath;
    }catch(e){
        return undefined;
    }
}

export const uploadFile = async (name:string, file:ArrayBuffer) =>{
    const bufferFile = Buffer.from(file)
    try{
        await mainBucket.file(name).save(bufferFile);
        return name;
    }catch{
        return undefined;
    }
}

export const deleteFile = async (fullPath:string) =>{
    try{
        await mainBucket.file(fullPath).delete();
        return fullPath;
    }catch{
        return undefined;
    }
}
export const deleteFolder = async (fullPath:string) =>{
    const path = (fullPath.endsWith("/") ? fullPath : `${fullPath}/`).replace(/^\//, '')
    try{
        await mainBucket.deleteFiles({prefix: path});
        await deleteFile(path);
        return fullPath;
    }catch{
        return undefined;
    }
}


export const fileListener = (socket:Socket) =>{
    socket.on("documents:uploadFile", async(clientUID, name:string, fragments:number)=>{
        const id = getUid();
        const onError = (e?:any) => socket.emit(`documents:uploadError:${id}`, e)
        const onSuccess = (res:any) => socket.emit(`documents:uploadSuccess:${id}`, res)
        const fileFragmentListener = (fragment:number):Promise<number[]> => new Promise((res, rej)=>{
            const listenerName = `documents:uploadFragment:${id}:${fragment}`;
            const cb = (data:Uint8Array) =>{
                socket.off(listenerName, cb);
                res(Array.from(data));
                socket.emit(listenerName, true)
            }
            socket.on(listenerName, cb)
            setTimeout(() => rej("Timeout"), 60000);
        });
        const promises = Array(fragments).fill(null).map((_, idx) =>{
            return fileFragmentListener(idx);
        });
        socket.emit(`documents:uploadFile:${clientUID}`, id);
        let result: Uint8Array;
        try{
            const promiseResult = (await Promise.all(promises))
            result = new Uint8Array(promiseResult.flat()); 
        }catch(e){
            console.log(e)
            return onError(e);
        }
        const uploadResult = await uploadFile(name, result.buffer);
        if(uploadResult === undefined) return onError();
        onSuccess(uploadResult);
    })
} 