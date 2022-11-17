export interface Movimiento{
  id?: string,
  uid: string,
  cantOro: number,
  cantUsd?: number,
  tipoMov: string,
  reino: string,
  reinoString?: string,
  fecha: Date,
  fechaAjustada: Date,
  eliminable?: boolean,
  fuente?: string,
}
