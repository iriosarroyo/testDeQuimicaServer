"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalSocket = exports.globalSocket = void 0;
const authentification_1 = require("../firebase/authentification");
const DDBB_1 = require("../firebase/DDBB");
const firebaseConfig_1 = require("../firebase/firebaseConfig");
const messaging_1 = require("../firebase/messaging");
const logros_json_1 = __importDefault(require("../data/logros.json"));
const storage_1 = require("../firebase/storage");
const uid_1 = __importDefault(require("../tools/uid"));
const stats_1 = __importStar(require("../stats"));
const paths_1 = require("../data/paths");
const peopleConnected = {};
const connectionStart = {};
const connect = (uid, idConnection, socket) => {
    if (peopleConnected[uid] === undefined) {
        peopleConnected[uid] = { [idConnection]: socket };
        connectionStart[uid] = Date.now();
        (0, DDBB_1.writeAdmin)(`users/${uid}/connected`, true);
    }
    else
        peopleConnected[uid] = { ...peopleConnected[uid] ?? {}, [idConnection]: socket };
};
const disconnect = (uid, idConnection) => {
    delete peopleConnected[uid]?.[idConnection];
    if (peopleConnected[uid] === undefined || Object.keys(peopleConnected[uid] ?? {}).length === 0) {
        peopleConnected[uid] = undefined;
        const timeConnected = Date.now() - (connectionStart[uid] ?? Date.now());
        (0, DDBB_1.pushAdmin)('connectionTime', {
            date: connectionStart[uid],
            timeConnected,
            uid
        });
        (0, DDBB_1.writeAdmin)(`users/${uid}/connected`, false);
        (0, DDBB_1.writeAdmin)(`users/${uid}/lastConnection`, Date.now());
    }
};
const listenerWithUid = (socket, listener, cb) => {
    socket.on(listener, async (uid, ...params) => {
        const res = await cb(...params);
        socket.emit(`${listener}:${uid}`, res);
    });
};
const execOnUser = (user, cb) => {
    Object.values(peopleConnected[user] ?? {}).forEach(cb);
};
const execToAllUsers = (cb) => {
    Object.values(peopleConnected).forEach((user) => {
        Object.values(user ?? {}).forEach(cb);
    });
};
exports.default = async (socket) => {
    const { tokenId } = socket.handshake.auth;
    const uid = await (0, authentification_1.uidVerifiedUser)(tokenId);
    if (uid === undefined)
        return socket.disconnect(true);
    const idConnection = (0, uid_1.default)();
    connect(uid, idConnection, socket);
    socket.on("disconnect", () => disconnect(uid, idConnection));
    socket.on("disconnectUser", () => socket.disconnect()); // just for testing purpose
    socket.on(paths_1.PATHS_SCKT.ddbbHistory, async () => {
        socket.emit(paths_1.PATHS_SCKT.ddbbHistory, await (0, DDBB_1.readMainCache)(`stats/${uid}/history`));
    });
    socket.on(paths_1.PATHS_SCKT.messagingToken, (token, topics) => {
        (0, messaging_1.manageToken)(uid, token, topics);
    });
    listenerWithUid(socket, paths_1.PATHS_SCKT.userStats, (start, end) => (0, stats_1.getAllStats)(start, end, uid));
    socket.on(paths_1.PATHS_SCKT.updateLogros, async (logroKey, logroData, extraInfo) => {
        let result, newValue, val;
        if (logroKey === "testDeHoySeguidos") {
            //extraInfo must be todays day in number
            if (typeof extraInfo !== "number")
                return;
            const { value, data } = logroData ?? { value: 0, data: { currStreak: 0, lastDay: 0 } };
            const { currStreak, lastDay } = data;
            const newStreak = extraInfo === lastDay + 1 ? currStreak + 1 : 1;
            newValue = Math.max(value, newStreak);
            val = value;
            result = await (0, DDBB_1.writeMain)(`users/${uid}/logros/${logroKey}`, {
                value: newValue,
                data: {
                    currStreak: newStreak,
                    lastDay: extraInfo
                }
            });
        }
        else if (logroKey === "numberOf10") {
            const { value, data } = logroData ?? { value: 0, data: {} };
            val = value;
            const puntsTemas = extraInfo;
            const hasEverHadA10 = Object.entries(puntsTemas).map(([k, v]) => ([k, v === 10 || Boolean(data[k])]));
            const newData = Object.fromEntries(hasEverHadA10);
            newValue = hasEverHadA10.filter(([, v]) => v).length;
            result = await (0, DDBB_1.writeMain)(`users/${uid}/logros/${logroKey}`, {
                value: newValue,
                data: newData
            });
        }
        else {
            if (logroKey === "preguntasDone" && typeof extraInfo !== "number")
                return;
            const valueToAdd = logroKey === "preguntasDone" ? Number(extraInfo) : 1;
            const { value } = logroData ?? { value: 0 };
            val = value;
            newValue = value + valueToAdd;
            result = await (0, DDBB_1.writeMain)(`users/${uid}/logros/${logroKey}/value`, newValue);
        }
        const logroConseguido = val === newValue ? undefined
            : Object.values(logros_json_1.default).find(logro => (logro.key === logroKey && newValue === logro.value));
        const resultStars = logroConseguido && await (0, DDBB_1.addToMain)(`users/${uid}/stars`, logroConseguido.stars);
        if (logroConseguido !== undefined)
            socket.emit("onLogroCompletion", logroConseguido.id);
        if (result === undefined && resultStars === undefined)
            socket.emit("main:respuesta", logroKey);
    });
    socket.on('main:starsFromAllUsers', async () => {
        const [users, error] = await (0, DDBB_1.filterAdmins)("users");
        if (error)
            return socket.emit("main:starsFromAllUsers", null);
        const result = Object.values(users ?? {}).map((user) => {
            const x = user;
            return { stars: x.stars ?? 0, username: x.username ?? "Anónimo" };
        });
        socket.emit("main:starsFromAllUsers", result);
    });
    socket.on('main:getLogrosFromUser', async (user) => {
        const [userdata, error] = await (0, DDBB_1.queryChildEqualToMain)('users', 'username', user);
        if (error)
            return socket.emit("main:getLogrosFromUser", {});
        const { logros } = Object.values(userdata ?? {})[0] ?? {};
        return socket.emit("main:getLogrosFromUser", logros ?? {});
    });
    listenerWithUid(socket, "user:isAdmin", () => (0, authentification_1.isAdminUid)(uid));
    listenerWithUid(socket, "sendStatsForAdmin", (data) => (0, stats_1.default)(data, uid));
    const isAdmin = await (0, authentification_1.isAdminUid)(uid);
    listenerWithUid(socket, "main:deleteUserFromDDBB", async (id) => {
        if (id !== uid && !isAdmin)
            return;
        const result = await (0, DDBB_1.writeMain)(`users/${uid}`, null);
        return result === undefined;
    });
    listenerWithUid(socket, "main:isUsernameInDDBB", async (username) => {
        const [users, error] = await (0, DDBB_1.readMain)("users");
        if (error)
            return true;
        return Object.values((users ?? {})).some(x => x.username === username);
    });
    const isEditor = isAdmin || await (0, authentification_1.isEditorUid)(uid);
    if (!isEditor)
        return undefined;
    socket.on("main:pregunta", async (val) => {
        const [id, preg] = val;
        const result = await (0, DDBB_1.writeMain)(`${paths_1.PATHS_DDBB.preguntas}/${id}`, preg);
        if (result === undefined)
            socket.emit("main:pregunta", val);
    });
    socket.on("main:respuesta", async (val) => {
        const [id, resp] = val;
        const result = await (0, DDBB_1.writeMain)(`respuestas/${id}`, resp);
        if (result === undefined)
            socket.emit("main:respuesta", val);
    });
    if (!isAdmin)
        return undefined;
    socket.on("firebase:messaging:notification", async (title, body, topic) => {
        try {
            await (0, messaging_1.sendNotification)(title, body, topic);
            socket.emit("firebase:messaging:notification", true);
        }
        catch {
            socket.emit("firebase:messaging:notification", false);
        }
    });
    socket.on("main:inicio:content", async (val) => {
        const result = await (0, DDBB_1.writeMain)("/inicio/opciones/inicio003/content", val);
        if (result === undefined)
            socket.emit("main:inicio:content", val);
    });
    socket.on("read:main:respuestas", async (id) => {
        const [result, error] = await (0, DDBB_1.readMainCache)(`respuestas/${id}`, 0.01);
        if (error === undefined)
            socket.emit("read:main:respuestas", result);
    });
    socket.on("nextId", async () => {
        try {
            const num = await firebaseConfig_1.mainDB.ref(paths_1.PATHS_DDBB.preguntas).once("value").then((x) => x.numChildren()) + 1;
            let id;
            if (num < 10)
                id = `id000${num}`;
            else if (num < 100)
                id = `id00${num}`;
            else if (num < 1000)
                id = `id0${num}`;
            else
                id = `id${num}`;
            socket.emit("nextId", id);
        }
        catch { }
    });
    socket.on("numOfPregs", async () => {
        const num = await firebaseConfig_1.mainDB.ref(paths_1.PATHS_DDBB.preguntas).once("value").then((x) => x.numChildren());
        socket.emit("numOfPregs", num);
    });
    socket.on("write:main", async (path, val) => {
        const result = await (0, DDBB_1.writeMain)(path, val);
        if (result === undefined)
            socket.emit("write:main", val);
    });
    socket.on("documents:renameFile", async (path, name) => {
        socket.emit("documents:renameFile", await (0, storage_1.renameFile)(path, name));
    });
    socket.on("documents:createFolder", async (path, name) => {
        socket.emit("documents:createFolder", await (0, storage_1.createFolder)(path, name));
    });
    (0, storage_1.fileListener)(socket);
    listenerWithUid(socket, "documents:renameFolder", storage_1.renameFolder);
    listenerWithUid(socket, "documents:deleteFolder", storage_1.deleteFolder);
    listenerWithUid(socket, "documents:deleteFile", storage_1.deleteFile);
    listenerWithUid(socket, "main:allQuestions", () => Promise.all([
        (0, DDBB_1.readMain)(paths_1.PATHS_DDBB.preguntas).then(x => x[0]),
        (0, DDBB_1.readMain)("respuestas").then(x => x[0]),
    ]));
    listenerWithUid(socket, "users:editData", (uid, val, path) => {
        return (0, DDBB_1.writeMain)(`users/${uid}/${path}`, val);
    });
    listenerWithUid(socket, "main:mantenimiento", (state) => (0, DDBB_1.writeMain)('mantenimiento', state));
    socket.on("allUsersData", (uid) => (0, authentification_1.getAllUsersListener)(socket, uid));
    listenerWithUid(socket, "stats:allStats", (start, end, id) => (0, stats_1.getAllStats)(start, end, id));
    listenerWithUid(socket, "datoCurioso:edit", DDBB_1.editDatoCurioso);
    listenerWithUid(socket, "datoCurioso:new", DDBB_1.newDatoCurioso);
    listenerWithUid(socket, "datoCurioso:delete", DDBB_1.deleteDatoCurioso);
    listenerWithUid(socket, "datosCuriosos:active", DDBB_1.activeDatosCuriosos);
    listenerWithUid(socket, "admin:disconnectUser", (user) => execOnUser(user, (s) => s?.disconnect()));
    listenerWithUid(socket, "admin:reloadUser", (user) => execOnUser(user, (s) => s?.emit("admin:reload")));
    listenerWithUid(socket, "admin:disconnectAllUsers", () => execToAllUsers((s) => s?.disconnect()));
    listenerWithUid(socket, "admin:reloadAllUsers", () => execToAllUsers((s) => s?.emit("admin:reload")));
    listenerWithUid(socket, "admin:allUids", DDBB_1.getAllUids);
    listenerWithUid(socket, "notification:getAllGroups", messaging_1.getAllGroups);
    listenerWithUid(socket, "notification:addPersonToGroup", messaging_1.addPersonToGroup);
    listenerWithUid(socket, "notification:removePersonFromGroup", messaging_1.removePersonFromGroup);
    listenerWithUid(socket, "notification:createGroup", messaging_1.createGroup);
    listenerWithUid(socket, "notification:deleteGroup", messaging_1.deleteGroup);
    listenerWithUid(socket, "notification:copyGroup", messaging_1.copyGroup);
    listenerWithUid(socket, "notification:renameGroup", messaging_1.renameGroup);
    listenerWithUid(socket, "notification:sendEmail", messaging_1.sendEmail);
    listenerWithUid(socket, "notification:getStoredEmail", () => (0, messaging_1.getStoredEmail)(uid));
    listenerWithUid(socket, "notification:saveEmail", (data) => (0, messaging_1.saveEmail)(socket, uid, data));
};
const setGlobalSocket = (val) => exports.globalSocket = val;
exports.setGlobalSocket = setGlobalSocket;
