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
import { UserPref } from '../models/userpref.model';

@Injectable()
export class UserPrefService {
  userPrefColeccion!: AngularFirestoreCollection<UserPref>;
  userPrefDoc!: AngularFirestoreDocument<UserPref>;
  userPref!: Observable<UserPref | null>;
  user: User;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private router: Router) {
    this.user = JSON.parse(localStorage.getItem('userData')!) as User
    this.userPrefColeccion = afs.collection('userPref');
  }

  cargarUserPref(): Observable<UserPref|null> {
    this.userPrefDoc = this.afs.doc<UserPref>(`userPref/${this.user.uid}`);
    this.userPref = this.userPrefDoc.snapshotChanges().pipe(
      map(
        (accion) => {
          if (accion.payload.exists === false) {
            let nuevoUserPref: UserPref = {
              usdx100K: 5,
              valorToken: 227154,
            }
            this.guardarUserPref(nuevoUserPref)
            return nuevoUserPref;
          } else {
            const datos = accion.payload.data() as UserPref;
            return datos;
          }
        }
      )
    );
    return this.userPref;
  }

  guardarUserPref(userPref: UserPref) {
    let res = false;
    return this.afs.doc(`userPref/${this.user.uid}`).set(userPref).then(() => { res = true; return true}).finally(() => {return res});
  }
}
