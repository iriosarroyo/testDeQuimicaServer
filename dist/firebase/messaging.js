"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.manageToken = void 0;
const DDBB_1 = require("./DDBB");
const firebaseConfig_1 = require("./firebaseConfig");
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
const manageToken = async (token, topics) => {
    const path = `messaging/tokens/${token}`;
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
