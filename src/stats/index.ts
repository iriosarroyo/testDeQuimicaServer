import { FastifyInstance } from "fastify"
const userRoutes = async (fastify:FastifyInstance, _:{}, done:Function) =>{
    fastify.get("/hello", {},  async() => ({hello: "users hello"}))
    fastify.get("/by", {}, async () => ({hello: "users bye"}))
    done();
}

export default userRoutes
