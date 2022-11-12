import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { LoginService } from '../../../services/login.service';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';

export const passwordNoCoincide: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const password2 = control.get('password2');

  return password?.value != password2?.value ? { passwordNoCoincide: true } : null;
};

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  errorSignup = false;
  errorMessage = '';

  formulario = new FormGroup({
    'username': new FormControl('', Validators.minLength(6)),
    'email': new FormControl('', Validators.email),
    'password': new FormControl('', Validators.minLength(8)),
    'password2': new FormControl('')
  }, {
    updateOn: 'submit',
    validators: [ Validators.required, passwordNoCoincide]
  });

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {}

  registro() {
    let nuevoUsuario = {
      'username': this.formulario.controls.username.value!,
      'email': this.formulario.controls.email.value!,
      'password': this.formulario.controls.password.value!
    }

    this.formulario.markAllAsTouched()
    if (this.formulario.valid) {
      this.loginService.SignUp(nuevoUsuario)
        .then(
          (error) => {
            if (error) {
              this.errorMessage = error.message;
              this.errorSignup = true;
            } else {
              this.router.navigate([`/login/${true}`])
            }
          }
      )
    }
  }

}
