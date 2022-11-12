import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoginService } from '../services/login.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private afAuth: AngularFireAuth, private loginService: LoginService) {}

  canActivate(): Observable<boolean> {
    // return this.loginService.getLoginStatus().pipe(map((resultado) => {
    //   if (!resultado) {
    //     this.router.navigate(['/login'])
    //     return false;
    //   }
    //   return true;
    // }))


    return this.afAuth.authState.pipe(
      map((auth) => {
        if (!auth) {
          this.router.navigate(['/login']);
          return false;
        } else {
          return true;
        }
      })
    );
  }
}
