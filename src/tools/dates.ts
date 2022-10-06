import { timeNothing, timer } from "./timing"

const HRS_TO_MS = 3600 * 1000
const DAY_TO_MS = 24 * HRS_TO_MS

const CACHE_TIMES_CHANGES:{[k:string]:number[]|undefined} = {}
export const getDateOfTimeChanges = (year:number) =>{
    // 1 am of last day of the month.
    const inCache = CACHE_TIMES_CHANGES[year]
    if(inCache) return inCache;
    const lastDayOfMarch = Date.UTC(year, 2, 31, 1)
    const dayOfLastDayOfMarch = new Date(lastDayOfMarch).getUTCDay()
    const lastDayOfOctober = Date.UTC(year, 9, 31, 1)
    const dayOfLastDayOfOctober = new Date(lastDayOfOctober).getUTCDay()
    const result = [lastDayOfMarch - dayOfLastDayOfMarch * DAY_TO_MS, 
        lastDayOfOctober - dayOfLastDayOfOctober * DAY_TO_MS]
    CACHE_TIMES_CHANGES[year] = result;
    return result
}
export const isSummerTime = (date:Date) =>{
    const time = date.getTime()
    const year = date.getUTCFullYear();
    const [marchChange, octoberChange] = getDateOfTimeChanges(year);
    return time >= marchChange && time <= octoberChange
}

export const getCETTime = (date:Date|number) => {
        let ms = (typeof date === "number" ? date : date.getTime()) + 1 * HRS_TO_MS // Sum 1 hour as CET is UTC +1 or +2 (UTC+1)
        const dateObj = new Date(date)
        if(isSummerTime(dateObj)) ms += 1 * HRS_TO_MS //Sum 1 hour if is summer time (UTC+2)
        const UTCDate = new Date(ms)
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
        }
        
}
export const getNumOfDays = (time:Date|number) => Math.floor(getCETTime(time).time / DAY_TO_MS);
const runGetDatesNtimes = timer(function getDatesTiming(it:number){
    for(let i = 0; i < it; i++){
        getCETTime((i + 1) * 16000000)
    }
})

/* runGetDatesNtimes(1e6)
timeNothing(1e6) */