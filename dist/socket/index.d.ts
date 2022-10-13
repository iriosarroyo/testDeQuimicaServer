import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
declare const _default: (socket: Socket) => Promise<Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined>;
export default _default;
export declare let globalSocket: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
export declare const setGlobalSocket: (val: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
