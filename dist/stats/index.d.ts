import { FastifyInstance } from "fastify";
declare const userRoutes: (fastify: FastifyInstance, _: {}, done: Function) => Promise<void>;
export default userRoutes;
