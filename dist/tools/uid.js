"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validStarting = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
const validChars = 'qwertyuiopasdfghjklzxcvbnm-_1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
const usedUIDS = [];
const getUid = (id_length = 32) => {
    let id = validStarting[Math.floor(validStarting.length * Math.random())];
    while (id.length < id_length) {
        id += validChars[Math.floor(validChars.length * Math.random())];
    }
    if (usedUIDS.includes(id))
        return getUid();
    usedUIDS.push(id);
    return id;
};
exports.default = getUid;
