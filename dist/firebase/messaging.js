"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveEmail = exports.getStoredEmail = exports.sendEmail = exports.getAllGroups = exports.removePersonFromGroup = exports.addPersonToGroup = exports.renameGroup = exports.deleteGroup = exports.copyGroup = exports.createGroup = exports.getGroupsFromDB = exports.getGroupAllUsers = exports.getGroupByDBProp = exports.sendNotification = exports.manageToken = void 0;
const DDBB_1 = require("./DDBB");
const firebaseConfig_1 = require("./firebaseConfig");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = require("dotenv");
const socket_1 = require("../socket");
(0, dotenv_1.config)();
const subscribeToTopic = (token, topic) => {
    return firebaseConfig_1.mainMsg.subscribeToTopic(token, topic);
};
const updateAllTokens = async () => {
    const [tokens] = await (0, DDBB_1.readAdmin)("messaging/tokens");
    const initVal = {};
    if (tokens === undefined)
        return;
    const tokensByTopic = Object.entries(tokens).reduce((prevValue, [token, tokenInfo]) => {
        const { topics } = tokenInfo;
        const allTopics = topics.split(";");
        allTopics.forEach(top => {
            prevValue[top] ??= [];
            prevValue[top].push(token);
        });
        return prevValue;
    }, initVal);
    Object.entries(tokensByTopic).forEach(([topic, tokens]) => {
        firebaseConfig_1.mainMsg.unsubscribeFromTopic(tokens, topic).then((response) => {
            const { errors } = response;
            errors.sort((a, b) => b.index - a.index);
            errors.forEach((err) => {
                const { error, index } = err;
                if (error.code !== "UNREGISTERED" && error.code !== "INVALID_ARGUMENT")
                    return;
                (0, DDBB_1.writeAdmin)(`messaging/tokens/${tokensByTopic[topic][index]}`, null);
                tokensByTopic[topic].splice(index);
            });
        });
        firebaseConfig_1.mainMsg.subscribeToTopic(tokensByTopic[topic], topic);
    });
};
const A_MONTH = 30 * 24 * 3600000;
const manageToken = async (uid, token, topics) => {
    const path = `messaging/tokens/${token}`;
    const path2 = `notifications/tokens/${uid}/${token}`;
    (0, DDBB_1.writeAdmin)(path2, true);
    const isInAdmin = (await (0, DDBB_1.inAdmin)(path))[0];
    if (!isInAdmin)
        await (0, DDBB_1.writeAdmin)(path, { topics: topics.join(";") });
    if ((((await (0, DDBB_1.readAdmin)('messaging/lastUpdate'))[0] ?? 0) + A_MONTH) < Date.now()) {
        await updateAllTokens();
        await (0, DDBB_1.writeAdmin)('messaging/lastUpdate', Date.now());
    }
    else if (!isInAdmin) {
        await Promise.all(topics.map(topic => subscribeToTopic(token, topic)));
    }
};
exports.manageToken = manageToken;
const sendNotification = (title, body, topic) => {
    return firebaseConfig_1.mainMsg.sendAll([
        {
            topic,
            notification: {
                title,
                body,
            }
        }
    ]);
};
exports.sendNotification = sendNotification;
let dict_cache;
let cache_timeout = 0;
const getUsersDict = async () => {
    if (cache_timeout > Date.now() && dict_cache)
        return dict_cache;
    const usersAuth = await firebaseConfig_1.mainAuth.listUsers();
    const dict = {};
    usersAuth.users.forEach(({ uid, email }) => { dict[uid] = email; });
    dict_cache = dict;
    cache_timeout = Date.now() + 15 * 60 * 1000; // 15 minutes
    return dict;
};
const getNotificationDataFromUser = ([uid, user], listUsers) => {
    const { name, surname } = user;
    const email = listUsers[uid];
    return { completeName: `${name} ${surname}`, uid, email };
};
const getGroupByDBProp = async (prop, value, secondProp) => {
    const promises = [
        (0, DDBB_1.queryChildEqualToMain)('users', prop, value, secondProp),
        getUsersDict(),
    ];
    const [usersRead, dict] = await Promise.all(promises);
    const [users] = usersRead;
    return Object.entries(users ?? {}).map(x => getNotificationDataFromUser(x, dict));
};
exports.getGroupByDBProp = getGroupByDBProp;
const getGroupAllUsers = async () => {
    const promises = [
        (0, DDBB_1.readMainCache)('users'),
        getUsersDict(),
    ];
    const [usersRead, dict] = await Promise.all(promises);
    const [users] = usersRead;
    //An array for the flat
    return {
        id: 'autogenerated_all_users',
        name: 'Todos los usuarios',
        disabled: true,
        people: Object.entries(users ?? {}).map(x => getNotificationDataFromUser(x, dict))
    };
};
exports.getGroupAllUsers = getGroupAllUsers;
const getGroupsFromDB = async () => {
    const promises = [
        (0, DDBB_1.readAdmin)('groups'),
        (0, DDBB_1.readMainCache)('users'),
        getUsersDict(),
    ];
    const [adminRead, mainRead, dict] = await Promise.all(promises);
    const [groups] = adminRead;
    const [users] = mainRead;
    return Object.entries(groups ?? {}).map(([id, group]) => ({
        id,
        ...group,
        people: Object.entries(group.people ?? {}).map(([uid, email]) => {
            if (typeof email === "string")
                return { email, uid };
            return getNotificationDataFromUser([uid, users[uid]], dict);
        })
    }));
};
exports.getGroupsFromDB = getGroupsFromDB;
const createGroup = async (name) => {
    const [ref] = await (0, DDBB_1.pushAdmin)('groups', { name });
    return ref?.key;
};
exports.createGroup = createGroup;
const copyGroup = async (name, people) => {
    const [ref] = await (0, DDBB_1.pushAdmin)('groups', { name, people });
    return ref?.key;
};
exports.copyGroup = copyGroup;
const deleteGroup = async (id) => {
    const err = await (0, DDBB_1.writeAdmin)(`groups/${id}`, null);
    return err === undefined;
};
exports.deleteGroup = deleteGroup;
const renameGroup = async (id, newName) => {
    const err = await (0, DDBB_1.writeAdmin)(`groups/${id}/name`, newName);
    return err === undefined;
};
exports.renameGroup = renameGroup;
const addPersonToGroup = async (id, uid, isEmail) => {
    if (!isEmail) {
        const err = await (0, DDBB_1.writeAdmin)(`groups/${id}/people/${uid}`, true);
        return err === undefined;
    }
    const [ref] = await (0, DDBB_1.pushAdmin)(`groups/${id}/people`, uid);
    return ref?.key;
};
exports.addPersonToGroup = addPersonToGroup;
const removePersonFromGroup = async (id, uid) => {
    const err = await (0, DDBB_1.writeAdmin)(`groups/${id}/people/${uid}`, null);
    return err === undefined;
};
exports.removePersonFromGroup = removePersonFromGroup;
const CURSOS = {
    eso3: "3º ESO",
    eso4: "4º ESO",
    bach1: "1º bach",
    bach2: "2º bach"
};
// Remains group with all users
const getAllGroups = async () => {
    const rnd = Math.random();
    console.time("timing" + rnd);
    const res = await Promise.all([
        (0, exports.getGroupAllUsers)(),
        Promise.all(Object.entries(CURSOS).map(async ([id, name]) => ({
            people: await (0, exports.getGroupByDBProp)('year', id),
            disabled: true,
            name,
            id: `autogenerated_${id}`,
        }))),
        Promise.all(Array(2).fill(null).map(async (_, i) => ({
            name: i === 0 ? 'Admins' : 'No admins',
            disabled: true,
            id: `autogenerated_admin_${i === 0}`,
            people: await (i === 0 ? (0, exports.getGroupByDBProp)('admin', true) : (0, exports.getGroupByDBProp)('admin', null, false))
        }))),
        Promise.all(Array(1).fill(null).map(async (_, i) => ({
            name: 'Editores',
            disabled: true,
            id: `autogenerated_editor`,
            people: await (0, exports.getGroupByDBProp)('editor', true)
        }))),
        (0, exports.getGroupsFromDB)(),
    ]);
    console.timeEnd("timing" + rnd);
    return res.flat(1);
};
exports.getAllGroups = getAllGroups;
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});
const sendEmail = (emails, subject, html) => {
    return transporter.sendMail({
        from: process.env.email,
        bcc: emails,
        html, subject
    });
};
exports.sendEmail = sendEmail;
let timeout;
const localStoredEmails = {};
const getStoredEmail = (uid) => (localStoredEmails[uid] ?? (0, DDBB_1.readAdmin)(`emails/${uid}`).then(x => x[0]));
exports.getStoredEmail = getStoredEmail;
const counts = {};
const saveEmail = (socket, uid, { emails, groups, html, subject, users }) => {
    const obj = {
        groups,
        users,
        emails,
        subject,
        html
    };
    socket_1.globalSocket.emit(`notifications:${uid}:email`, socket.id, obj);
    localStoredEmails[uid] = obj;
    const thisCount = (counts[uid] ?? 0) + 1;
    counts[uid] = thisCount;
    const write = () => (0, DDBB_1.writeAdmin)(`emails/${uid}`, {
        groups: groups ?? null,
        users: users ?? null,
        emails: emails ?? null,
        subject: subject ?? null,
        html: html ?? null
    });
    if (thisCount % 200 === 0)
        write();
    clearTimeout(timeout);
    timeout = setTimeout(write, 15000);
};
exports.saveEmail = saveEmail;
