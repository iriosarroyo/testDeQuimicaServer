"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNumOfDays = exports.getCETTime = exports.isSummerTime = exports.getDateOfTimeChanges = void 0;
const timing_1 = require("./timing");
const HRS_TO_MS = 3600 * 1000;
const DAY_TO_MS = 24 * HRS_TO_MS;
const CACHE_TIMES_CHANGES = {};
const getDateOfTimeChanges = (year) => {
    // 1 am of last day of the month.
    const inCache = CACHE_TIMES_CHANGES[year];
    if (inCache)
        return inCache;
    const lastDayOfMarch = Date.UTC(year, 2, 31, 1);
    const dayOfLastDayOfMarch = new Date(lastDayOfMarch).getUTCDay();
    const lastDayOfOctober = Date.UTC(year, 9, 31, 1);
    const dayOfLastDayOfOctober = new Date(lastDayOfOctober).getUTCDay();
    const result = [lastDayOfMarch - dayOfLastDayOfMarch * DAY_TO_MS,
        lastDayOfOctober - dayOfLastDayOfOctober * DAY_TO_MS];
    CACHE_TIMES_CHANGES[year] = result;
    return result;
};
exports.getDateOfTimeChanges = getDateOfTimeChanges;
const isSummerTime = (date) => {
    const time = date.getTime();
    const year = date.getUTCFullYear();
    const [marchChange, octoberChange] = (0, exports.getDateOfTimeChanges)(year);
    return time >= marchChange && time <= octoberChange;
};
exports.isSummerTime = isSummerTime;
const getCETTime = (date) => {
    let ms = (typeof date === "number" ? date : date.getTime()) + 1 * HRS_TO_MS; // Sum 1 hour as CET is UTC +1 or +2 (UTC+1)
    const dateObj = new Date(date);
    if ((0, exports.isSummerTime)(dateObj))
        ms += 1 * HRS_TO_MS; //Sum 1 hour if is summer time (UTC+2)
    const UTCDate = new Date(ms);
    return {
        year: UTCDate.getUTCFullYear(),
        month: UTCDate.getUTCMonth(),
        date: UTCDate.getUTCDate(),
        day: UTCDate.getUTCDay(),
        hours: UTCDate.getUTCHours(),
        minutes: UTCDate.getUTCMinutes(),
        seconds: UTCDate.getUTCSeconds(),
        milliseconds: UTCDate.getUTCMilliseconds(),
        time: ms
    };
};
exports.getCETTime = getCETTime;
const getNumOfDays = (time) => Math.floor((0, exports.getCETTime)(time).time / DAY_TO_MS);
exports.getNumOfDays = getNumOfDays;
const runGetDatesNtimes = (0, timing_1.timer)(function getDatesTiming(it) {
    for (let i = 0; i < it; i++) {
        (0, exports.getCETTime)((i + 1) * 16000000);
    }
});
/* runGetDatesNtimes(1e6)
timeNothing(1e6) */ 
