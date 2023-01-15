interface OpcionTest{
    id:string,
    value:string,
}

export interface PreguntaTest{
    id:string,
    done: boolean,
    level: '1'|'2'|'3',
    nivelYTema:string,
    opciones:{[k:string]:OpcionTest}
    pregunta:string,
    tema:string,
    year:string
}