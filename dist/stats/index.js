"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userRoutes = async (fastify, _, done) => {
    fastify.get("/hello", {}, async () => ({ hello: "users hello" }));
    fastify.get("/by", {}, async () => ({ hello: "users bye" }));
    done();
};
exports.default = userRoutes;
