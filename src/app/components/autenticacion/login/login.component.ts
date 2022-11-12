import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../../services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  formulario = new FormGroup({
    'email': new FormControl('', Validators.email),
    'password': new FormControl(''),
  }, {
    updateOn: 'submit',
    validators: Validators.required
  });

  cargando = false;
  boolError = false;
  registrado = false;
  errorMessage = '';

  constructor(
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.registrado = this.route.snapshot.params['registrado'];
  }

  login() {
    let usuario = {
      'email': this.formulario.controls.email.value!,
      'password': this.formulario.controls.password.value!
    }
    this.formulario.markAllAsTouched()
    if (this.formulario.valid) {
      this.cargando = true;
      this.loginService.SignIn(usuario).then(
        (error) => {
          if (error) {
            this.boolError = true;
            this.errorMessage = error.message;
            this.registrado = false;
          }
          this.cargando = false;
        }
      )
    }
  }
}
