"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
            "https://test-de-quimica.firebaseapp.com"
        ]
    } });
fastify.register(Promise.resolve().then(() => __importStar(require("./stats"))), { prefix: "users" });
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
fastify.ready().then(() => {
    fastify.io.on("connection", socket_1.default);
});
fastify.listen({ port: parseInt(process.env.PORT ?? '3001')}, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
});
