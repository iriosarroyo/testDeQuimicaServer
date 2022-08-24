"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileListener = exports.deleteFolder = exports.deleteFile = exports.uploadFile = exports.renameFile = exports.renameFolder = exports.createFolder = void 0;
const uid_1 = __importDefault(require("../tools/uid"));
const firebaseConfig_1 = require("./firebaseConfig");
const createFolder = async (path, name) => {
    const folderPath = `${path}/${name}/`;
    try {
        await firebaseConfig_1.mainBucket.file(folderPath).save('');
        return folderPath;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
};
exports.createFolder = createFolder;
const renameFolder = async (prevPath, path, name) => {
    const previousPath = (prevPath.endsWith("/") ? prevPath : `${prevPath}/`).replace(/^\//, '');
    const folderPath = `${path}/${name}/`;
    try {
        const [files] = await firebaseConfig_1.mainBucket.getFiles({ prefix: previousPath });
        await Promise.all(files.map(file => file.move(file.name.replace(previousPath, folderPath))));
        return [previousPath, folderPath];
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
};
exports.renameFolder = renameFolder;
const renameFile = async (path, name) => {
    const newPath = path.replace(/(\/[^\/]+)$/, `/${name}`);
    try {
        await firebaseConfig_1.mainBucket.file(path).rename(newPath);
        return newPath;
    }
    catch (e) {
        return undefined;
    }
};
exports.renameFile = renameFile;
const uploadFile = async (name, file) => {
    const bufferFile = Buffer.from(file);
    try {
        await firebaseConfig_1.mainBucket.file(name).save(bufferFile);
        return name;
    }
    catch {
        return undefined;
    }
};
exports.uploadFile = uploadFile;
const deleteFile = async (fullPath) => {
    try {
        await firebaseConfig_1.mainBucket.file(fullPath).delete();
        return fullPath;
    }
    catch {
        return undefined;
    }
};
exports.deleteFile = deleteFile;
const deleteFolder = async (fullPath) => {
    const path = (fullPath.endsWith("/") ? fullPath : `${fullPath}/`).replace(/^\//, '');
    try {
        await firebaseConfig_1.mainBucket.deleteFiles({ prefix: path });
        await (0, exports.deleteFile)(path);
        return fullPath;
    }
    catch {
        return undefined;
    }
};
exports.deleteFolder = deleteFolder;
const fileListener = (socket) => {
    socket.on("documents:uploadFile", async (clientUID, name, fragments) => {
        const id = (0, uid_1.default)();
        const onError = (e) => socket.emit(`documents:uploadError:${id}`, e);
        const onSuccess = (res) => socket.emit(`documents:uploadSuccess:${id}`, res);
        const fileFragmentListener = (fragment) => new Promise((res, rej) => {
            const listenerName = `documents:uploadFragment:${id}:${fragment}`;
            const cb = (data) => {
                socket.off(listenerName, cb);
                res(Array.from(data));
                socket.emit(listenerName, true);
            };
            socket.on(listenerName, cb);
            setTimeout(() => rej("Timeout"), 60000);
        });
        const promises = Array(fragments).fill(null).map((_, idx) => {
            return fileFragmentListener(idx);
        });
        socket.emit(`documents:uploadFile:${clientUID}`, id);
        let result;
        try {
            const promiseResult = (await Promise.all(promises));
            result = new Uint8Array(promiseResult.flat());
        }
        catch (e) {
            console.log(e);
            return onError(e);
        }
        const uploadResult = await (0, exports.uploadFile)(name, result.buffer);
        if (uploadResult === undefined)
            return onError();
        onSuccess(uploadResult);
    });
};
exports.fileListener = fileListener;
