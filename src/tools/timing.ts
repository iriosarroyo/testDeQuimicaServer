export const timer = (fn:(...params:any[]) => any) =>{
    const timeName = `Timing ${fn.name}`
    const wrapper = (...params:any[]) =>{
        console.time(timeName)
        const res = fn(...params)
        console.timeEnd(timeName)
        //console.log(`${fn.name} called with ${params} as arguments. The output is`, res)
        return res
    }
    return wrapper;
}

export const timeNothing = timer(function doNothingNtimes(n:number){
    let a = 0;
    for(let i = 0; i <n; i++) a += n;
}) 

const rnd_string = 'id0989;id2131;id0007;id9878;id0097;'

const split_count = (it:number) =>{
    const res:{[k:string]:number} = {}
    for(let i = 0; i <it; i++){
        const elems = rnd_string.replace(/;$/, "").split(";");
        for(const elem of elems){
            res[elem] = (res[elem] ?? 0) + 1;
        }
    }
    return res;
}
//timer(split_count)(1e5)


const split_count_forEach = (it:number) =>{
    const res:{[k:string]:number} = {}
    for(let i = 0; i <it; i++){
        
    }
    return res;
}

/* const iterations = 1e5
timer(split_count_forEach)(iterations)
timer(split_count)(iterations) */
