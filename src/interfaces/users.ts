export type LogrosKeys = 'numberOf10' | 'testDeHoySeguidos' | 'mensajes' | 'formulario' | 'recursos'
| 'downloadedDocs' | 'testsDone' | 'onlineDone' | 'testDeHoyMaxPunt' | 'preguntasDone'
| 'groupsCreated' | 'groupsJoined' | 'commandsExecuted'

export type Logro = {value:number, data?:any}|undefined

export interface CustomVarStyles{
    '--bg-color': string,
    '--bg2-color': string,
    '--bg3-color': string,
    '--bg-red-color': string,
    '--font-color': string,
    '--font2-color': string,
    '--font-red-color': string,
    '--logo-bg':string,
    '--logo-fg':string,
  }

export interface UserDDBB{
    admin: boolean|undefined,
    editor?:boolean,
    numOfSquares?:number,
    room: string|undefined,
    group:string,
    mobile:string,
    name:string,
    surname:string,
    username:string,
    velocidad:number,
    year:string,
    mode: string|undefined,
    unaPorUna: boolean,
    shortcuts:{[key:string]:string}|undefined,
    notificaciones: boolean|undefined,
    lastTest: number|undefined,
    stars:number,
    logros:{[key in LogrosKeys]:Logro}|undefined,
    customStyles?: CustomVarStyles,
    temas?: {[key:string]:undefined|{[key:string]:{aciertos:string, fallos:string, enBlanco:string}}}
  }

  export interface Group{
    name:string,
    people:{
        [k:string]:boolean|string
    }
  }