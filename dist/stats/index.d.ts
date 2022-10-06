import { AveragesTime, CompGeneralStatsWUser, GeneralTime, StatsData } from "../interfaces/stats";
import "../tools/dates";
declare const saveStats: (data: StatsData, id: string) => Promise<string | false>;
export declare const getAllStats: (start?: number, end?: number, uidToSelect?: string | null) => Promise<{
    statsTestDeHoy: CompGeneralStatsWUser;
    statsOnline: CompGeneralStatsWUser;
    statsTime: {
        timesPerUser: {
            [k: string]: GeneralTime & AveragesTime;
        };
        timesPerDay: {
            [k: string]: GeneralTime & AveragesTime;
        };
        notActive: string[];
        sum_timeConnected: number;
        num_connections: number;
        fullName?: string | undefined;
        uids?: Set<string> | undefined;
    } & AveragesTime;
    statsTests: CompGeneralStatsWUser;
}>;
export default saveStats;
