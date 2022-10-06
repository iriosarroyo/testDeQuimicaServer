import {getCETTime, getDateOfTimeChanges, isSummerTime} from "../src/tools/dates"
test("getDateOfTimeChanges produces correct output", () =>{
    expect(getDateOfTimeChanges(2022)).toStrictEqual([
        Date.UTC(2022, 2, 27, 1),
        Date.UTC(2022, 9, 30, 1)
    ])
    expect(getDateOfTimeChanges(2023)).toStrictEqual([
        Date.UTC(2023, 2, 26, 1),
        Date.UTC(2023, 9, 29, 1)
    ])
    expect(getDateOfTimeChanges(2024)).toStrictEqual([
        Date.UTC(2024, 2, 31, 1),
        Date.UTC(2024, 9, 27, 1)
    ])
})

test("isSummerTime produces correct output", () =>{
    // Assumes machine has CET time
    expect(isSummerTime(new Date(2022, 9, 1))).toBe(true)
    expect(isSummerTime(new Date(2022, 9, 30))).toBe(true)
    expect(isSummerTime(new Date(2022, 9, 30, 2))).toBe(true)
    expect(isSummerTime(new Date(2022, 9, 30, 2, 30))).toBe(true)
    expect(isSummerTime(new Date(2022, 9, 30, 3))).toBe(false)
    expect(isSummerTime(new Date(2022, 11, 30))).toBe(false)
    expect(isSummerTime(new Date(2023, 0, 1, 0))).toBe(false)
    expect(isSummerTime(new Date(2023, 1, 1, 0))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 1, 0))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 25, 0))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 26, 0))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 26, 1))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 26, 1, 59))).toBe(false)
    expect(isSummerTime(new Date(2023, 2, 26, 2))).toBe(true)
    expect(isSummerTime(new Date(2023, 2, 26, 2, 1))).toBe(true)
    expect(isSummerTime(new Date(2023, 5, 1))).toBe(true)
})

const getExpectedDateInCET = (date:Date) =>{
    // Assumes machine has CET time
    return {
        year: date.getFullYear(),
        month: date.getMonth(),
        date: date.getDate(),
        day: date.getDay(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        milliseconds: date.getMilliseconds(),
        time: date.getTime() + (isSummerTime(date) ? 2*3_600_000 : 3_600_000)
    }
}

test("isSummerTime produces correct output", () =>{
    // Assumes machine has CET time
    let date = new Date(2022, 9, 1)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2022, 9, 30)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2022, 9, 30, 2)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2022, 9, 30, 2, 30)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2022, 9, 30, 3)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2022, 11, 30)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2023, 0, 1, 0)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2023, 2, 26, 1, 59)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2023, 2, 26, 2)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2023, 2, 26, 2, 1)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
    date = new Date(2023, 5, 1)
    expect(getCETTime(date)).toStrictEqual(getExpectedDateInCET(date))
})