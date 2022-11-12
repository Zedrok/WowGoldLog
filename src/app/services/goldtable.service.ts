import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { map, Observable, take, takeWhile, Subscription, BehaviorSubject } from 'rxjs';
import { GoldTable } from '../models/goldtable.model';
import { ReinosService } from './reinos.service';
import { LoginService } from './login.service';
import { StatInventario } from '../models/statInventario.model';
import { User } from '../models/user.model';

@Injectable()
export class GoldTableService {
  goldTablesColeccion!: AngularFirestoreCollection<GoldTable>;
  goldTablesDoc!: AngularFirestoreDocument<GoldTable[]>;
  goldTables!: Observable<GoldTable[] | null>;
  // statInventario = new BehaviorSubject<StatInventario>({total: 0});

  reinoSub!: Subscription;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private reinosService: ReinosService, private loginService: LoginService) {
    this.goldTablesColeccion = afs.collection('goldTables');
  }

  cargarGoldTables() {
    // Se extraen los reinos permitidos del localStorage
    let reinosUsuario = (JSON.parse(localStorage.getItem('userData')!)).reinos as string[]
    let uid = (JSON.parse(localStorage.getItem('userData')!).uid)
    this.goldTablesDoc = this.afs.doc<GoldTable[]>(`/goldTables/${uid}`)
    this.goldTables = this.goldTablesDoc.snapshotChanges().pipe(
      map(
        (accion) => {
          if (accion.payload.exists === false) {
            let datosFiltrados: GoldTable[] = [];
            reinosUsuario.forEach((reino) => {
              if (datosFiltrados.filter((tablaUsuario) => reino === tablaUsuario.reino).length == 0) {
                datosFiltrados.push(
                  {
                    inventario: 0,
                    pendiente: 0,
                    reino: reino,
                    total: 0
                  }
                )
              }
            })
            if (datosFiltrados.length == 0) {
              return null
            }
            this.guardarTablas(datosFiltrados)
            return datosFiltrados
          } else {
            // Se guarda el arreglo de reinos en 'datos'
            const datos = (accion.payload.data()! as any).goldTables as GoldTable[];
            // Filtrado de datos, sólo reinos que se encuentren en el arreglo permitido
            let datosFiltrados = datos.filter((tabla) => reinosUsuario.some((reino) => reino === tabla.reino))
            let total = 0;
            datosFiltrados.forEach((tabla) => {
              total += tabla.total
            })

            reinosUsuario.forEach((reino) => {
              if(datosFiltrados.filter((tablaUsuario) => reino === tablaUsuario.reino).length == 0) {
                datosFiltrados.push(
                  {
                    inventario: 0,
                    pendiente: 0,
                    reino: reino,
                    total: 0,
                  }
                )
              }
            })
            return datosFiltrados;
          }
        }
      )
    );
    return this.goldTables;
  }

  cargarNombreReinos(goldtables: GoldTable[]) {
    goldtables.forEach((goldtable) => {
      this.loginService.getLoginStatus().subscribe(
        (status) => {
          if (status) {
            this.reinoSub = this.reinosService.getReino(goldtable.reino).subscribe(
              (resultado) => {
                goldtable.reinoString = resultado!.nombre
              }
            )
          } else {
            this.reinoSub.unsubscribe();
          }
        }
      )
    })
  }


  guardarTablas(goldTablesNuevas: GoldTable[]) {
    console.log('se guardaron tablas: '+ JSON.stringify(goldTablesNuevas));

    let res = false;
    let user = JSON.parse(localStorage.getItem('userData')!) as User
    return this.afs.doc(`goldTables/${user.uid}`).set({ "goldTables": goldTablesNuevas }).then(() => { res = true; return true}).finally(() => {return res})
  }
}
