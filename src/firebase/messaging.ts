import { Topics } from "../interfaces/firebase";
import { inAdmin, readAdmin, writeAdmin } from "./DDBB";
import { mainMsg } from "./firebaseConfig";

const subscribeToTopic = (token:string|string[], topic:Topics) =>{
    return mainMsg.subscribeToTopic(token, topic);
}

const updateAllTokens = async () =>{
    const [tokens] = await readAdmin("messaging/tokens") as [{[key:string]:{topics:string}}|undefined, Error|undefined];
    const initVal:{[k:string]:string[]} = {};
    if(tokens === undefined) return;
    const tokensByTopic = Object.entries(tokens).reduce((prevValue, [token, tokenInfo]:[string,{topics:string}]) => {
        const {topics} = tokenInfo;
        const allTopics = topics.split(";");
        allTopics.forEach(top => {
            prevValue[top] ??= [];
            prevValue[top].push(token)
        })
        return prevValue;
    }, initVal)
    Object.entries(tokensByTopic).forEach(([topic, tokens]) =>{
        mainMsg.unsubscribeFromTopic(tokens, topic).then((response) =>{
            const {errors} =response;
            errors.sort((a,b) => b.index - a.index)
            errors.forEach((err) =>{
                const { error, index} =err
                if(error.code !== "UNREGISTERED" && error.code !== "INVALID_ARGUMENT") return;
                writeAdmin(`messaging/tokens/${tokensByTopic[topic][index]}`, null)
                tokensByTopic[topic].splice(index);
            })
        })
        mainMsg.subscribeToTopic(tokensByTopic[topic], topic);
    });
}   
console.log('hello', subscribeToTopic("fwUxOaRvvqtbjM6eNUWBrC:APA91bFEPi0eSFr9r-mJijsfqKdOJ4lsiympYTQ8OuwUFqYWVkBS3EGoM_myrNrxU7YWTWmen-0Sl2NoHyWmk1g0dCe47IhhC6CJU4cG-u-I85SK588nhPtxK6w-lO9pDfrE6au-dsvS", 
"test"))
const A_MONTH = 30 * 24 * 3600000
export const manageToken = async (token:string, topics:Topics[]) =>{
    const path = `messaging/tokens/${token}`;
    const isInAdmin = (await inAdmin(path))[0]
    if(!isInAdmin) await writeAdmin(path, { topics: topics.join(";")});
    if((((await readAdmin('messaging/lastUpdate'))[0] ?? 0) +  A_MONTH )< Date.now()){
        await updateAllTokens();
        await writeAdmin('messaging/lastUpdate', Date.now())
    }else if(!isInAdmin){
        await Promise.all(topics.map(topic => subscribeToTopic(token, topic)))
    }

}

 
export const sendNotification = (title:string, body:string, topic:Topics) =>{
    return mainMsg.sendAll([
        {
            topic,
            notification:{
                title,
                body,
            }
        }
    ])

}