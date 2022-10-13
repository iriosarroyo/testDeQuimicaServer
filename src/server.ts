import fastifyFn from "fastify";
import fastifyFormbody from "@fastify/formbody";
import fastifyIO from "fastify-socket.io"
import { uidVerifiedUser } from "./firebase/authentification";
import { WelcomeBody } from "./interfaces/bodies";
import socket, { setGlobalSocket } from "./socket";
const fastify = fastifyFn({logger:true});

fastify.register(fastifyFormbody)
fastify.register(fastifyIO, {cors:{
    origin:[
        "https://testdequimica-bcf90.web.app",
        "https://testdequimica-bcf90.firebaseapp.com",
        "https://test-de-quimica.web.app",
        "https://test-de-quimica.firebaseapp.com",
        "https://test-de-fisica.web.app",
        "https://test-de-fisica.firebaseapp.com",
        "https://test-de-biologia.web.app",
        "https://test-de-biologia.firebaseapp.com",
        "http://localhost:3000"
    ]
}})

const getWelcomeOpts = {schema:{
    body:{
        type: 'object',
        properties:{
            tokenId:{type:"string"}
        }
    } ,
    response:{
        200:{
            type:'object',
            properties:{
                hello: {type:'string'}
            }
        }
    }  
}}
fastify.get("/welcome", async (req, res) =>{
    const body = req.body as WelcomeBody;
    const { tokenId } = body;
    const uid = await uidVerifiedUser(tokenId)
    if(uid === undefined) return res.send(false);
    return res.send(true);
})

fastify.get("/inicio", async (req, res) =>{
    return true
})

fastify.ready().then(()=>{
    fastify.io.on("connection", socket)
    setGlobalSocket(fastify.io)
})

fastify.listen({port:parseInt(process.env.PORT ?? '3001'), host:'0.0.0.0'}, (err, address) =>{
    if(err){
        fastify.log.error(err);
        process.exit(1)
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
})