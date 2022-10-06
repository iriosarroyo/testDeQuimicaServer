export declare const getDateOfTimeChanges: (year: number) => number[];
export declare const isSummerTime: (date: Date) => boolean;
export declare const getCETTime: (date: Date | number) => {
    year: number;
    month: number;
    date: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    time: number;
};
export declare const getNumOfDays: (time: Date | number) => number;
