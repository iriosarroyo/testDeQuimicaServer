import { pushAdmin } from "../firebase/DDBB";

const count = (str:string, sep = ";") => str.match(RegExp(sep, "g"))?.length ?? 0
const saveStats = async (data:any, id:string) =>{
    const {type, time, date, score, numOfQuestions, blank, correct, 
        incorrect, answers, uid} = data;
    const blank_count = count(blank);
    const correct_count = count(correct);
    const incorrect_count = count(incorrect);
    if(id !== uid) return false;
    if(!['online', 'testDeHoy'].includes(type)) return `type should be 'online' or 'testDeHoy' instead of ${type}`;
    if(typeof time !== "number" || time <= 0) return `time should be a number instead of ${time}`;
    if(typeof date !== "number") return `date should be a number instead of ${date}`;
    if(typeof score !== "number") return `score should be a number instead of ${score}`;;
    if(typeof numOfQuestions !== "number" || numOfQuestions <= 0) 
        return `numOfQuestions should be a number and greater than 0, instead of  ${numOfQuestions}`;
    if(typeof blank_count !== "number" || blank_count < 0 || blank_count > numOfQuestions) 
        return `blank_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
            instead of  ${blank_count}`;
    if(typeof correct_count !== "number" || correct_count < 0 || correct_count > numOfQuestions) 
        return `correct_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
            instead of  ${correct_count}`;
    if(typeof incorrect_count !== "number" || incorrect_count< 0 || incorrect_count > numOfQuestions) 
        return `incorrect_count should be a number, greater than or equal to 0 and less than or equal to the number of questions,
         instead of  ${incorrect_count}`;
    if(typeof answers !== "object" || answers === null) return `answers should be an object instead of ${answers}`;
    const [, err] = await pushAdmin("testStats", data);
    if(err) return err.message;
    return "Upload complete";
}

export default saveStats