import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { BehaviorSubject, map, Observable, pipe, Subscription, take } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { GoldTableService } from './goldtable.service';

@Injectable()
export class LoginService {
  userData: any;
  userDoc!: AngularFirestoreDocument<User>
  userCollection!: AngularFirestoreCollection<User>;
  datosCargados!: BehaviorSubject<boolean>;
  userSub: any;
  afSub: any;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private router: Router) {
    this.userCollection = this.afs.collection('users');
    this.datosCargados = new BehaviorSubject<boolean>(false);
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        this.getUser(user.uid).pipe(
          map((userData) => {
            if (userData) {
              localStorage.setItem('userAfsData', JSON.stringify(this.userData));
              localStorage.setItem('userData', JSON.stringify(userData))
              this.datosCargados.next(true);
            }
          }), take(1)
        )
        if (JSON.parse(localStorage.getItem('userData')!) != null) {
          this.datosCargados.next(true);
        } else {
          this.datosCargados.next(false);
        }
      } else {
        this.datosCargados.next(false);
        localStorage.setItem('userAfsData', 'null');
        localStorage.setItem('userData', 'null');
      }
    })
  }

  SignIn(nuevoUsuario: any) {
    return this.afAuth
      .signInWithEmailAndPassword(nuevoUsuario.email, nuevoUsuario.password)
      .then((result) => {
        this.userSub = this.getUser(result.user!.uid)
        this.userSub = this.userSub.subscribe(
          (usuario: User) => {
            this.setUser(usuario!);
            this.router.navigate(['/home'])
          }
        )
      })
      .catch((error) => {
        switch (error.code) {
          case 'auth/user-not-found': {
            error.message = 'Usuario no encontrado.'
            break;
          }
          case 'auth/too-many-requests': {
            error.message = 'Demasiados intentos de inicio de sesión, espere un momento.'
            break;
          }
          default : {
            error.message = 'Usuario o contraseña incorrecta.'
            break;
          }
        }
        return error
      });
  }

   // Sign up with email/password
   SignUp(nuevoUsuario: any) {
    return this.afAuth
      .createUserWithEmailAndPassword(nuevoUsuario.email, nuevoUsuario.password)
      .then((result) => {
        this.afAuth.signOut().then(
          () => this.agregarUsuario(result.user!.uid, nuevoUsuario)
        )
      })
      .catch((error) => {
        if (error) {
          switch (error.code) {
            case 'auth/email-already-in-use': {
              error.message = "El correo ya se encuentra en uso."
              return error
            }
            default: {
              error.message = "Error al crear la cuenta"
              break;
            }
          }
        }
        return error;
      });
  }

  agregarUsuario(uid: string, nuevoUsuario: any) {
    let data : User = {
      uid: uid,
      email: nuevoUsuario.email,
      username: nuevoUsuario.username
    }
    this.userCollection.doc(uid).set(data)
  }

  setUser(user: User) {
    this.userData = user;
    localStorage.setItem('userData', JSON.stringify(user))
    localStorage.setItem('userAfsData', JSON.stringify(this.userData));
    this.datosCargados.next(true);
  }

  getAuth() {
    return this.afAuth.authState.pipe(map((auth) => auth));
  }

  getUser(id: string) {
    return this.userCollection.doc(id).valueChanges()
  }

  getLoginStatus() {
    return this.datosCargados.asObservable();
  }

  logout() {
    if (this.userSub) {
      (this.userSub as Subscription).unsubscribe()
    }
    this.datosCargados.next(false);
    localStorage.setItem('userAfsData', 'null');
    localStorage.setItem('userData', 'null');

    this.afAuth.signOut().then(
      () => {
        this.router.navigate(['/login'])
      }
    );
  }
}
