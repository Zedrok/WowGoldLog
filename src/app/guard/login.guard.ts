import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoginService } from '../services/login.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private router: Router, private afAuth: AngularFireAuth, private loginService: LoginService) {}

  canActivate(): Observable<boolean> {
    return this.loginService.getLoginStatus().pipe(map((resultado) => {
      if (resultado) {
        this.router.navigate(['/home'])
        return false;
      }
      return true;
    }))
  }
}
