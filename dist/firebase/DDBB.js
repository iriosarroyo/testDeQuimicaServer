"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUids = exports.activeDatosCuriosos = exports.deleteDatoCurioso = exports.newDatoCurioso = exports.editDatoCurioso = exports.getUsers = exports.addToMain = exports.inAdmin = exports.queryChildEqualToMain = exports.filterAdmins = exports.pushAdmin = exports.pushMain = exports.writeAdmin = exports.writeMain = exports.readAdminCache = exports.readMainCache = exports.readAdmin = exports.readMain = void 0;
const socket_1 = require("../socket");
const firebaseConfig_1 = require("./firebaseConfig");
const readDDBB = (database) => {
    return async (path) => {
        try {
            const snap = await database.ref(path).once("value");
            return [snap.val(), undefined];
        }
        catch (error) {
            if (!(error instanceof Error))
                return [undefined, undefined];
            return [undefined, error];
        }
    };
};
exports.readMain = readDDBB(firebaseConfig_1.mainDB);
exports.readAdmin = readDDBB(firebaseConfig_1.adminDB);
const MIN_TO_MS = 60000; // mins to milliseconds
/**
 *
 * @param {Function} reader
 */
const readCache = (reader) => {
    const cache = {};
    /**
     * @param {string} path database path
     * @param {number} cacheTimer time in mins to expire cache data, 15 mins as default
     * @returns {Promise<[any, Error|undefined]>}
     */
    return async (path, cacheTimer = 15, ...params) => {
        if (cache[path] !== undefined && cache[path].time + cacheTimer * MIN_TO_MS > Date.now())
            return cache[path].data;
        const data = await reader(path, ...params);
        cache[path] = { data, time: Date.now() };
        return data;
    };
};
exports.readMainCache = readCache(exports.readMain);
exports.readAdminCache = readCache(exports.readAdmin);
const writeDDBB = (database) => {
    return async (path, value) => {
        try {
            await database.ref(path).set(value);
        }
        catch (error) {
            if ((error instanceof Error))
                return error;
        }
        return undefined;
    };
};
exports.writeMain = writeDDBB(firebaseConfig_1.mainDB);
exports.writeAdmin = writeDDBB(firebaseConfig_1.adminDB);
const pushDDBB = (database) => {
    return async (path, value) => {
        try {
            const result = await database.ref(path).push(value);
            return [result, undefined];
        }
        catch (error) {
            if ((error instanceof Error))
                return [undefined, error];
        }
        return [undefined, undefined];
    };
};
exports.pushMain = pushDDBB(firebaseConfig_1.mainDB);
exports.pushAdmin = pushDDBB(firebaseConfig_1.adminDB);
const inDDBB = (database) => {
    return async (path) => {
        try {
            const snap = await database.ref(path).once("value");
            return [snap.exists(), undefined];
        }
        catch (error) {
            if (!(error instanceof Error))
                return [undefined, undefined];
            return [undefined, error];
        }
    };
};
const addToDDBB = (database) => {
    return async (path, add = 1) => {
        return database.ref(path).transaction((value) => {
            if (value === undefined)
                return add;
            return value + add;
        });
    };
};
const queryChildEqualTo = (database) => {
    return async (path, child, equalTo, endAt) => {
        try {
            let filter = database.ref(path).orderByChild(child);
            if (endAt !== undefined)
                filter = filter.startAt(equalTo).endAt(endAt);
            else
                filter = filter.equalTo(equalTo);
            const snap = await filter.once("value");
            return [snap.val(), undefined];
        }
        catch (error) {
            if (!(error instanceof Error))
                return [undefined, undefined];
            return [undefined, error];
        }
    };
};
exports.filterAdmins = readCache((path) => queryChildEqualTo(firebaseConfig_1.mainDB)(path, "admin", null, false));
exports.queryChildEqualToMain = queryChildEqualTo(firebaseConfig_1.mainDB);
exports.inAdmin = inDDBB(firebaseConfig_1.adminDB);
exports.addToMain = addToDDBB(firebaseConfig_1.mainDB);
const getUsers = () => (0, exports.readMain)("users").then(x => x[0]);
exports.getUsers = getUsers;
const PATH_DATOS_CURIOSOS = "inicio/datosCuriosos";
const PATH_ACTIVE_DATOS_CURIOSOS = "inicio/activeDatosCuriosos";
const timeout_table = {};
const editing_table = new Proxy({}, { set(target, prop, value) {
        target[prop] = value;
        socket_1.globalSocket.emit("datosCuriosos:editing", target);
        return true;
    }, });
const editDatoCurioso = (key, val, username) => {
    if (key in timeout_table)
        clearTimeout(timeout_table[key]);
    if (editing_table[key] !== username)
        editing_table[key] = username;
    (0, exports.writeMain)(`${PATH_DATOS_CURIOSOS}/${key}`, val);
    setTimeout(() => { editing_table[key] = undefined; }, 15000);
};
exports.editDatoCurioso = editDatoCurioso;
const newDatoCurioso = () => (0, exports.pushMain)(PATH_DATOS_CURIOSOS, "");
exports.newDatoCurioso = newDatoCurioso;
const deleteDatoCurioso = (key) => (0, exports.writeMain)(`${PATH_DATOS_CURIOSOS}/${key}`, null);
exports.deleteDatoCurioso = deleteDatoCurioso;
const activeDatosCuriosos = (val) => (0, exports.writeMain)(PATH_ACTIVE_DATOS_CURIOSOS, val);
exports.activeDatosCuriosos = activeDatosCuriosos;
const getAllUids = async () => {
    const [res] = await (0, exports.readMain)('users');
    return Object.keys(res ?? {});
};
exports.getAllUids = getAllUids;
