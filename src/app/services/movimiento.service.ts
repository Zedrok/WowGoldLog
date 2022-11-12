import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { map, Observable, take, BehaviorSubject } from 'rxjs';
import { Movimiento } from '../models/movimiento.model';
import { Reino } from '../models/reino.model';
import { User } from '../models/user.model';
import { LoginService } from './login.service';

@Injectable()
export class MovimientoService {
  movColeccion!: AngularFirestoreCollection<Movimiento>;
  movimientoDoc!: AngularFirestoreDocument<Movimiento>;
  movimientos!: Observable<Movimiento[]>;
  movimiento?: Observable<Movimiento | null>;
  user: User;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private router: Router) {
    this.user = JSON.parse(localStorage.getItem('userData')!) as User
    this.movColeccion = afs.collection(
      'movimientos', (ref) => ref.where('uid', '==', this.user.uid)
    );
  }

  cargarMovimientos(): Observable<Movimiento[]> {
    this.movimientos = this.movColeccion.snapshotChanges().pipe(
      map((cambios) => {
        return cambios.map((accion) => {
          const datos = accion.payload.doc.data() as Movimiento;
          datos.id = accion.payload.doc.id;
          datos.fecha = ((accion.payload.doc.data().fecha as any).toDate())
          return datos;
        });
      })
    );
    return this.movimientos;
  }

  guardarMovimiento(nuevoMovimiento: Movimiento) {
    let res = false;
    return this.movColeccion.add(nuevoMovimiento).then(() => res = true).finally(()=>{return res})
  }
}
