import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { map, Observable, take, BehaviorSubject } from 'rxjs';
import { Reino } from '../models/reino.model';
import { User } from '../models/user.model';
import { LoginService } from './login.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ReinosService {
  reinosColeccion!: AngularFirestoreCollection<Reino>;
  reinoDoc!: AngularFirestoreDocument<Reino>;
  reinos!: Observable<Reino[]>;
  reino?: Observable<Reino | null>;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private router: Router) {
    this.reinosColeccion = afs.collection('realms', (ref) =>
      ref.orderBy('nombre')
    );
  }

  cargarReinos(): Observable<Reino[]> {
    //Obtener reinos
    this.reinos = this.reinosColeccion.snapshotChanges().pipe(
      map((cambios) => {
        return cambios.map((accion) => {
          const datos = accion.payload.doc.data() as Reino;
          datos.id = accion.payload.doc.id;
          return datos;
        });
      })
    );
    return this.reinos;
  }

  getReino(reino: string) {
    this.reinoDoc = this.afs.doc<Reino>(`/realms/${reino}`);
    this.reino = this.reinoDoc.snapshotChanges().pipe(
      map((accion) => {
        if (accion.payload.exists === false) {
          return null;
        } else {
          const datos = accion.payload.data() as Reino;
          datos.id = accion.payload.id;
          return datos;
        }
      })
    );
    return this.reino;
  }

  guardarReinosUsuario(reinosGuardados: string[], snackBar: MatSnackBar) {
    let user = JSON.parse(localStorage.getItem('userData')!) as User
    user.reinos = reinosGuardados;
    localStorage.setItem('userData', JSON.stringify(user));
    return this.afs.doc(`users/${user.uid}`).update({ "reinos": reinosGuardados }).finally(
      () => {
        snackBar.open('Servidores guardados!', 'OK', {
          panelClass: 'snackbar-success',
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    )
  }
}
