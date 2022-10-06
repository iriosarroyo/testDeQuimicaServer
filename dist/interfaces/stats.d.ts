declare type Answers = {
    [k: string]: string;
};
interface Data {
    date: number;
    uid: string;
}
export interface StatsData extends Data {
    answers: Answers;
    blank: string;
    correct: string;
    incorrect: string;
    numOfQuestions: number;
    puntType: "Puntos" | "Aciertos" | "Fallos" | undefined;
    score: number;
    defScore: number;
    time: number;
    type: 'online' | 'testDeHoy';
}
export interface ConnectionData extends Data {
    timeConnected: number;
}
export interface GeneralStats {
    n_blank: number;
    n_correct: number;
    n_incorrect: number;
    n_incorrect_per_id: {
        [k: string]: number;
    } | undefined;
    n_questions: number;
    n_tests: number;
    sum_score: number;
    sum_defScore: number;
    sum_time: number;
    fullName?: string;
    uids?: Set<string>;
    statsPerUser?: {
        [k: string]: GeneralStats;
    };
    notDoneTest?: string[];
}
export interface Averages {
    ave_score: number;
    ave_defScore: number;
    ave_time: number;
    ave_defScore_exam: number;
    ave_score_exam: number;
    most_common_incorrect: {
        max: number;
        argsmax: string[];
    };
}
export interface GeneralStatsWUser extends GeneralStats {
    statsPerUser: {
        [k: string]: CompGeneralStats;
    };
}
export declare type CompGeneralStats = GeneralStats & Averages;
export interface CompGeneralStatsWUser extends CompGeneralStats {
    statsPerUser: {
        [k: string]: CompGeneralStats;
    };
}
export interface GeneralTime {
    sum_timeConnected: number;
    num_connections: number;
    notActive?: string[];
    fullName?: string;
    uids?: Set<string>;
    timesPerUser?: {
        [k: string]: GeneralTime;
    };
    timesPerDay?: {
        [k: string]: GeneralTime;
    };
}
export interface AveragesTime {
    ave_timeConnected: number;
    ave_per_user_timeConnected: number;
}
export {};
