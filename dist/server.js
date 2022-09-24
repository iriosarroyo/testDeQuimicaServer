"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
const authentification_1 = require("./firebase/authentification");
const socket_1 = __importDefault(require("./socket"));
const fastify = (0, fastify_1.default)({ logger: true });
fastify.register(formbody_1.default);
fastify.register(fastify_socket_io_1.default, { cors: {
        origin: [
            "https://testdequimica-bcf90.web.app",
            "https://testdequimica-bcf90.firebaseapp.com",
            "https://test-de-quimica.web.app",
            "https://test-de-quimica.firebaseapp.com",
            "http://localhost:3000"
        ]
    } });
const getWelcomeOpts = { schema: {
        body: {
            type: 'object',
            properties: {
                tokenId: { type: "string" }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    hello: { type: 'string' }
                }
            }
        }
    } };
fastify.get("/welcome", async (req, res) => {
    const body = req.body;
    const { tokenId } = body;
    const uid = await (0, authentification_1.uidVerifiedUser)(tokenId);
    if (uid === undefined)
        return res.send(false);
    return res.send(true);
});
fastify.get("/inicio", async (req, res) => {
    return true;
});
fastify.ready().then(() => {
    fastify.io.on("connection", socket_1.default);
});
fastify.listen({ port: parseInt(process.env.PORT ?? '3001'), host: '0.0.0.0' }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
});
