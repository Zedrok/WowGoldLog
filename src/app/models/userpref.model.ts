import { Personaje } from './personaje.model';
import { StatInventario } from './statInventario.model';

export interface UserPref{
  usdx100K: number,
  valorToken: number,
  personajes?: Personaje[];
}
