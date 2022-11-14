import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { GoldTable } from 'src/app/models/goldtable.model';
import { Personaje } from 'src/app/models/personaje.model';
import { GoldTableService } from 'src/app/services/goldtable.service';
import { LoginService } from 'src/app/services/login.service';
import { ModalPendienteComponent } from '../../home/modal-pendiente/modal-pendiente.component';
import { UserPrefService } from '../../../services/userpref.service';
import { UserPref } from '../../../models/userpref.model';
import { DataSourceAjustes } from '../ajustes.component';

@Component({
  selector: 'app-modal-personaje',
  templateUrl: './modal-personaje.component.html',
  styleUrls: ['./modal-personaje.component.css'],
})
export class ModalPersonajeComponent implements OnInit {
  formNombre: FormControl = new FormControl('');
  modalAbierto = true;
  cargando = false;

  userPref!: UserPref;
  userPrefSub!: Subscription;

  constructor(
    private goldtableService: GoldTableService,
    public dialogRef: MatDialogRef<ModalPendienteComponent>,
    private loginService: LoginService,
    private _snackBar: MatSnackBar,
    private userPrefService: UserPrefService,
    @Inject(MAT_DIALOG_DATA) public data: DataSourceAjustes
  ) {
    this.formNombre.addValidators(Validators.required);

    // Activar suscripción a la base de datos de las tablas
    loginService.getLoginStatus().subscribe((status) => {
      if (status) {
        console.log('subscribe userpref');
        this.userPrefSub = this.userPrefService
          .cargarUserPref()
          .subscribe((resultado) => {
            if (resultado) {
              this.userPref = resultado;
            }
          });
      } else {
        console.log('unsubscribe userpref');
        this.userPrefSub.unsubscribe();
      }
    });
  }

  ngOnInit(): void {
    if (this.data.personaje) {
      this.formNombre.setValue(this.data.personaje.nombre);
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.dialogRef.close();
  }

  async confirmarNombre() {
    this.formNombre.markAsTouched();
    if (!this.modalAbierto || !this.formNombre.valid) {
      return;
    }

    let nuevoPersonaje: Personaje = {
      nombre: this.formNombre.value,
      reino: this.data.reino!.id,
    };

    this.cargando = true;

    if (this.userPref.personajes == null) {
      this.userPref.personajes = [];
      this.userPref.personajes.push(nuevoPersonaje);
      console.log('No tiene personajes');
    } else {
      console.log('Si tiene personajes');
      if (this.data.personaje) {
        console.log('Ya tenía un personaje en el reino');
        let personajeBuscado = this.userPref.personajes.find((personaje) => {
          return (
            personaje.nombre == this.data.personaje!.nombre &&
            personaje.reino == this.data.reino!.id
          );
        });
        if (personajeBuscado) {
          console.log('Se encontró el personaje en el reino');
          let index = this.userPref.personajes.indexOf(personajeBuscado);
          this.userPref.personajes[index] = nuevoPersonaje;
        } else {
          console.log('No se encontró personaje en el reino');
        }
      } else {
        console.log('No existía personaje en el reino')
        this.userPref.personajes.push(nuevoPersonaje);
      }
    }

    if (await this.userPrefService.guardarUserPref(this.userPref)) {
      this._snackBar.open('Nombre guardado con éxito!', 'OK', {
        panelClass: 'snackbar-success',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    } else {
      this._snackBar.open('Error al guardar nombre', 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
    this.cerrarModal();
    this.cargando = false;
    // this.cerrarModal()
  }

  // getGoldTable(reino: string): GoldTable{
  //   let encontrado = this.inventarios.find((tabla) => { return tabla.reino === reino })!
  //   return encontrado
  // }
}
