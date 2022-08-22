const validStarting = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
const validChars = 'qwertyuiopasdfghjklzxcvbnm-_1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
const usedUIDS:string[] = []
const getUid = (id_length = 32):string => {
  let id = validStarting[Math.floor(validStarting.length * Math.random())];
  while (id.length < id_length) {
    id += validChars[Math.floor(validChars.length * Math.random())];
  }
  if (usedUIDS.includes(id)) return getUid();
  usedUIDS.push(id);
  return id;
};

export default getUid;

