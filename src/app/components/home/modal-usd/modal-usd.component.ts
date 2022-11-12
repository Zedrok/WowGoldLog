import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { UserPref } from 'src/app/models/userpref.model';
import { GoldTableService } from 'src/app/services/goldtable.service';
import { LoginService } from 'src/app/services/login.service';
import { UserPrefService } from '../../../services/userpref.service';

@Component({
  selector: 'app-modal-usd',
  templateUrl: './modal-usd.component.html',
  styleUrls: ['./modal-usd.component.css']
})
export class ModalUsdComponent implements OnInit {

  modalAbierto = true;
  formOro = new FormControl(0);
  userPrefSub!: Subscription;
  userPref!: UserPref
  cargando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalUsdComponent>,
    private _snackBar: MatSnackBar,
    private loginService: LoginService,
    private goldtableService: GoldTableService,
    private UserPrefService: UserPrefService
  ) {
    this.formOro.addValidators(Validators.min(1))
    this.formOro.addValidators(Validators.required)
    loginService.getLoginStatus().subscribe(
      (status) => {
        if (status) {
          this.userPrefSub = this.UserPrefService.cargarUserPref().subscribe(
            (resultado) => {
              if (resultado) {
                this.userPref = resultado;
                this.formOro.setValue(this.userPref.usdx100K)
              }
            }
          )
          console.log('subscribe userpref');
        } else {
          this.userPrefSub.unsubscribe()
          console.log('unsubscribe userpref');
        }
      }
    )
  }

  ngOnInit(): void {
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.dialogRef.close();
  }

  async guardarCambios() {
    this.formOro.markAsTouched()
    if (!this.modalAbierto || !this.formOro.valid ) {
      return;
    }
    this.cargando = true;

    this.userPref.usdx100K = this.formOro.value!

    if (await this.UserPrefService.guardarUserPref(this.userPref)) {
      this._snackBar.open('Cambios guardados con éxito!', 'OK', {
        panelClass: 'snackbar-success',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    } else {
      this._snackBar.open('Error al guardar cambios', 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }

    this.cargando = false;
    this.cerrarModal()
  }

}
