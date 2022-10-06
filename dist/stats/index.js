"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStats = void 0;
const DDBB_1 = require("../firebase/DDBB");
const firebaseConfig_1 = require("../firebase/firebaseConfig");
require("../tools/dates");
const dates_1 = require("../tools/dates");
const count = (str, sep = ";") => str.match(RegExp(sep, "g"))?.length ?? 0;
const countPerID = (str, initialValue = {}) => {
    const res = initialValue;
    const elems = str.replace(/;$/, "").split(";");
    elems.forEach(elem => elem !== '' && (res[elem] = (res[elem] ?? 0) + 1));
    return res;
};
const saveStats = async (data, id) => {
    const { type, time, date, score, numOfQuestions, blank, correct, incorrect, answers, uid, defScore } = data;
    const blank_count = count(blank);
    const correct_count = count(correct);
    const incorrect_count = count(incorrect);
    if (id !== uid)
        return false;
    if (!['online', 'testDeHoy'].includes(type))
        return `type should be 'online' or 'testDeHoy' instead of ${type}`;
    if (typeof time !== "number" || time <= 0)
        return `time should be a number instead of ${time}`;
    if (typeof date !== "number")
        return `date should be a number instead of ${date}`;
    if (typeof score !== "number")
        return `score should be a number instead of ${score}`;
    ;
    if (typeof defScore !== "number")
        return `score should be a number instead of ${defScore}`;
    ;
    if (typeof numOfQuestions !== "number" || numOfQuestions <= 0)
        return `numOfQuestions should be a number and greater than 0, instead of  ${numOfQuestions}`;
    if (typeof blank_count !== "number" || blank_count < 0 || blank_count > numOfQuestions)
        return `blank_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
            instead of  ${blank_count}`;
    if (typeof correct_count !== "number" || correct_count < 0 || correct_count > numOfQuestions)
        return `correct_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
            instead of  ${correct_count}`;
    if (typeof incorrect_count !== "number" || incorrect_count < 0 || incorrect_count > numOfQuestions)
        return `incorrect_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
         instead of  ${incorrect_count}`;
    if (typeof answers !== "object" || answers === null)
        return `answers should be an object instead of ${answers}`;
    const [, err] = await (0, DDBB_1.pushAdmin)(`testStats/${type}`, data);
    if (err)
        return err.message;
    return "Upload complete";
};
function getDataGen(dataType) {
    const getData = (start = 0, end = 9e99, filters) => {
        if (end < start)
            throw Error("End is smaller than start.");
        return firebaseConfig_1.adminDB.ref(dataType).orderByChild("date").startAt(start)
            .endAt(end).once("value").then((result) => {
            const values = Object.values(result.val() ?? {});
            if (!filters)
                return values;
            const filtersEntries = Object.entries(filters);
            return values.filter((x) => filtersEntries.every(([key, filterFn]) => (filterFn(x[key]))));
        });
    };
    return getData;
}
const getDataTest = getDataGen("testStats");
const getDataTestDeHoy = getDataGen("testStats/testDeHoy");
const getDataOnline = getDataGen("testStats/online");
const getDataConnection = getDataGen("connectionTime");
const DEF_GEN_STAT = {
    n_blank: 0,
    n_correct: 0,
    n_tests: 0,
    n_incorrect: 0,
    n_questions: 0,
    sum_score: 0,
    sum_defScore: 0,
    sum_time: 0,
    n_incorrect_per_id: undefined
};
const addGeneralStatsTest = (acum, curr) => {
    const { n_blank, n_correct, n_incorrect, n_questions, sum_defScore, sum_score, sum_time, uids, statsPerUser, n_tests, n_incorrect_per_id } = acum;
    const { blank, correct, incorrect, numOfQuestions, score, defScore, time, uid } = curr;
    if (statsPerUser)
        statsPerUser[uid] = addGeneralStatsTest(statsPerUser[uid] ?? DEF_GEN_STAT, curr);
    return {
        n_blank: n_blank + count(blank),
        n_correct: n_correct + count(correct),
        n_incorrect: n_incorrect + count(incorrect),
        n_questions: n_questions + numOfQuestions,
        n_tests: n_tests + 1,
        n_incorrect_per_id: countPerID(incorrect, n_incorrect_per_id),
        sum_score: sum_score + score,
        sum_defScore: sum_defScore + defScore,
        sum_time: sum_time + time,
        uids: uids?.add(uid),
        statsPerUser
    };
};
const getMaxFromObject = (obj) => {
    const entries = Object.entries(obj);
    const values = entries.map(entrie => entrie[1]);
    const max = Math.max(...values);
    return { max, argsmax: entries.filter(entrie => entrie[1] === max).map(entrie => entrie[0]) };
};
function getCompleteStatsTest(stats) {
    const { sum_score, sum_defScore, sum_time, n_questions, n_tests, n_incorrect_per_id } = stats;
    return {
        ...stats,
        n_incorrect_per_id: n_incorrect_per_id ?? {},
        most_common_incorrect: getMaxFromObject(n_incorrect_per_id ?? {}),
        ave_score: sum_score / n_questions,
        ave_score_exam: sum_score / n_tests,
        ave_defScore_exam: sum_defScore / n_tests,
        ave_defScore: sum_defScore / n_questions,
        ave_time: sum_time / n_questions
    };
}
const addCompleteTestStats = (stat1, stat2) => {
    const { n_blank, n_correct, n_incorrect, n_incorrect_per_id, n_questions, n_tests, statsPerUser, sum_defScore, sum_score, sum_time, uids, notDoneTest } = stat1;
    const { n_blank: n_blank2, n_correct: n_correct2, n_incorrect: n_incorrect2, n_questions: n_questions2, n_tests: n_tests2, statsPerUser: statsPerUser2, sum_defScore: sum_defScore2, sum_score: sum_score2, sum_time: sum_time2, uids: uids2, n_incorrect_per_id: n_incorrect_per_id2 } = stat2;
    const total_defScore = sum_defScore + sum_defScore2;
    const total_score = sum_score + sum_score2;
    const total_time = sum_time + sum_time2;
    const total_questions = n_questions + n_questions2;
    const total_tests = n_tests + n_tests2;
    const statsPerUserUnion = {};
    let newUids;
    if (uids && uids2) {
        newUids = new Set([...uids, ...uids2]);
        newUids.forEach(uid => {
            const statsUser1 = statsPerUser?.[uid];
            const statsUser2 = statsPerUser2?.[uid];
            if (statsUser1 === undefined && statsUser2 !== undefined && 'ave_defScore' in statsUser2)
                statsPerUserUnion[uid] = statsUser2;
            else if (statsUser2 === undefined && statsUser1 !== undefined && 'ave_defScore' in statsUser1)
                statsPerUserUnion[uid] = statsUser1;
            else if (statsUser1 !== undefined && statsUser2 !== undefined && 'ave_defScore' in statsUser1 && 'ave_defScore' in statsUser2)
                statsPerUserUnion[uid] = addCompleteTestStats(statsUser1, statsUser2);
        });
    }
    let n_incorrect_per_ids_union = {};
    if (n_incorrect_per_id && n_incorrect_per_id2) {
        const uniqueIds = new Set([...Object.keys(n_incorrect_per_id), ...Object.keys(n_incorrect_per_id2)]);
        uniqueIds.forEach(id => n_incorrect_per_ids_union[id] = (n_incorrect_per_id[id] ?? 0) + (n_incorrect_per_id2[id] ?? 0));
    }
    return {
        n_blank: n_blank + n_blank2,
        n_correct: n_correct + n_correct2,
        n_incorrect: n_incorrect + n_incorrect2,
        n_questions: total_questions,
        n_tests: total_tests,
        sum_defScore: total_defScore,
        sum_score: total_score,
        sum_time: total_time,
        ave_score: total_score / total_questions,
        ave_score_exam: total_score / total_tests,
        ave_defScore_exam: total_defScore / total_tests,
        ave_defScore: total_defScore / total_questions,
        ave_time: total_time / total_questions,
        statsPerUser: statsPerUserUnion,
        uids: newUids,
        n_incorrect_per_id: n_incorrect_per_ids_union,
        most_common_incorrect: getMaxFromObject(n_incorrect_per_ids_union),
        notDoneTest: notDoneTest ? [] : undefined
    };
};
const getAllStatsTest = (data) => {
    const generalStats = data.reduce(addGeneralStatsTest, {
        ...DEF_GEN_STAT,
        uids: new Set(),
        statsPerUser: {}
    });
    const statsPerUser = Object.fromEntries(Object.entries(generalStats.statsPerUser ?? {}).map(([k, v]) => ([k, getCompleteStatsTest(v)])));
    const res = { ...generalStats, statsPerUser, notDoneTest: [] };
    return getCompleteStatsTest(res);
};
const DEF_TIMES = {
    sum_timeConnected: 0,
    num_connections: 0
};
const addGeneralStatsTime = (acum, curr) => {
    const { sum_timeConnected, uids, timesPerUser, timesPerDay, num_connections } = acum;
    const { timeConnected, uid, date } = curr;
    const day = (0, dates_1.getNumOfDays)(date);
    if (timesPerUser)
        timesPerUser[uid] = addGeneralStatsTime(timesPerUser[uid] ?? DEF_TIMES, curr);
    if (timesPerDay)
        timesPerDay[day] = addGeneralStatsTime(timesPerDay[day] ?? { ...DEF_TIMES, uids: new Set() }, curr);
    return {
        sum_timeConnected: sum_timeConnected + timeConnected,
        num_connections: num_connections + 1,
        uids: uids?.add(uid),
        timesPerUser,
        timesPerDay
    };
};
function getCompleteStatsTimes(stats) {
    const { num_connections, sum_timeConnected, uids } = stats;
    return {
        ...stats,
        ave_timeConnected: sum_timeConnected / num_connections,
        ave_per_user_timeConnected: sum_timeConnected / (uids?.size || 1)
    };
}
const getAllStatsTime = (data) => {
    const generalStats = data.reduce(addGeneralStatsTime, {
        ...DEF_TIMES,
        uids: new Set(),
        timesPerUser: {},
        timesPerDay: {}
    });
    const timesPerUser = Object.fromEntries(Object.entries(generalStats.timesPerUser ?? {}).map(([k, v]) => ([k, getCompleteStatsTimes(v)])));
    const timesPerDay = Object.fromEntries(Object.entries(generalStats.timesPerDay ?? {}).map(([k, v]) => ([k, getCompleteStatsTimes(v)])));
    const res = { ...generalStats, timesPerUser, timesPerDay, notActive: [] };
    return getCompleteStatsTimes(res);
};
const getAllStats = async (start, end, uidToSelect) => {
    const rnd = "Stats-timing-" + Math.random();
    console.time(rnd);
    const users = !uidToSelect ? await (0, DDBB_1.getUsers)() : {};
    const filter = { uid: (uid) => {
            if (uidToSelect)
                return uid === uidToSelect;
            return !users[uid]?.admin;
        } };
    const [testDeHoy, online, connections] = await Promise.all([
        getDataTestDeHoy(start, end, filter),
        getDataOnline(start, end, filter),
        getDataConnection(start, end, filter),
    ]);
    const statsTestDeHoy = getAllStatsTest(testDeHoy);
    const statsOnline = getAllStatsTest(online);
    const statsTime = getAllStatsTime(connections);
    const statsTests = addCompleteTestStats(statsTestDeHoy, statsOnline);
    Object.entries(users).forEach(([uid, data]) => {
        const fullName = `${data.name} ${data.surname}`;
        const shouldPush = !uidToSelect && !users[uid]?.admin;
        if (uid in statsTestDeHoy.statsPerUser)
            statsTestDeHoy.statsPerUser[uid].fullName = fullName;
        else if (shouldPush)
            statsTestDeHoy.notDoneTest?.push(fullName);
        if (uid in statsOnline.statsPerUser)
            statsOnline.statsPerUser[uid].fullName = fullName;
        else if (shouldPush)
            statsOnline.notDoneTest?.push(fullName);
        if (uid in statsTests.statsPerUser)
            statsTests.statsPerUser[uid].fullName = fullName;
        else if (shouldPush)
            statsTests.notDoneTest?.push(fullName);
        if (uid in statsTime.timesPerUser)
            statsTime.timesPerUser[uid].fullName = fullName;
        else if (shouldPush)
            statsTime.notActive?.push(fullName);
    });
    console.timeEnd(rnd);
    return { statsTestDeHoy, statsOnline, statsTime, statsTests };
};
exports.getAllStats = getAllStats;
exports.default = saveStats;
