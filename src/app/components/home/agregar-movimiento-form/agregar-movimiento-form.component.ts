import { Component, Inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { GoldTable } from 'src/app/models/goldtable.model';
import { Movimiento } from 'src/app/models/movimiento.model';
import { GoldTableService } from 'src/app/services/goldtable.service';
import { LoginService } from '../../../services/login.service';
import { MovimientoService } from '../../../services/movimiento.service';
import { StatInventario } from '../../../models/statInventario.model';
import { UserPref } from 'src/app/models/userpref.model';
import { UserPrefService } from '../../../services/userpref.service';

@Component({
  selector: 'app-agregar-movimiento-form',
  templateUrl: './agregar-movimiento-form.component.html',
  styleUrls: ['./agregar-movimiento-form.component.css'],
})
export class AgregarMovimientoForm {
  inventarios: GoldTable[] = [];
  max = 0;
  modalAbierto = true;
  cargando = false;
  formulario = new FormGroup(
    {
      reinoSelect: new FormControl( JSON.parse(localStorage.getItem('userData')!).reinos[0], [Validators.required]),
      tipomovSelect: new FormControl('ingreso', [Validators.required]),
      estadoSelect: new FormControl('inventario', [Validators.required]),
      tipoventaSelect: new FormControl('trade'),
      formOro: new FormControl(0, [Validators.required, Validators.min(1)]),
      formUsd : new FormControl(0)
    }
  )
  userPref!: UserPref;
  userPrefSub!: Subscription;
  goldTableSub!: Subscription;

  constructor(
    private goldtableService: GoldTableService,
    public dialogRef: MatDialogRef<AgregarMovimientoForm>,
    private loginService: LoginService,
    private _snackBar: MatSnackBar,
    private movService: MovimientoService,
    private userPrefService: UserPrefService
  ) {


    // Activar suscripción a la base de datos de las tablas
    loginService.getLoginStatus().subscribe(
      (status) => {
        if (status) {
          console.log('subscribe goldtable');
          this.goldTableSub = this.goldtableService.cargarGoldTables().subscribe(
            (resultado) => {
              if (resultado != null) {
                this.goldtableService.cargarNombreReinos(resultado);
                this.inventarios = resultado;
              }
            }
          )
          this.userPrefSub = this.userPrefService.cargarUserPref().subscribe(
            (resultado) => {
              if (resultado) {
                this.userPref = resultado;
              }
            }
          )
        } else {
          this.goldTableSub.unsubscribe()
          console.log('unsubscribe goldtable');
        }
      }
    )
  }

  ngOnInit(): void {
    this.dialogRef
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.dialogRef.close();
  }

  getOroNecesario() {
    return this.formulario.value.formOro!*1000/0.95
  }

  getPerdida() {
    return this.getOroNecesario() * 0.05
  }

  getRecibidox100K() {
    if (this.formulario.value.formUsd != 0) {
      if (this.formulario.value.tipoventaSelect == "trade") {
        return this.formulario.value.formUsd!/(this.formulario.value.formOro!/100)
      } else {
        return this.formulario.value.formUsd!/(this.getOroNecesario()/100000)
      }
    }
    return 0;
  }

  getRecibidoxToken() {
    if (this.formulario.controls.formUsd.value! != 0) {
      return this.getRecibidox100K() / 100 * ((this.userPref)?this.userPref.valorToken!:0) / 1000
    }
    return 0;
  }

  modificarValidaciones() {
    if (this.formulario.value.tipomovSelect != 'ingreso') {
      if (this.formulario.value.tipomovSelect == 'venta') {
        this.formulario.controls.formUsd.addValidators(Validators.required)
        this.formulario.controls.formUsd.addValidators(Validators.min(1))
        this.formulario.controls.tipoventaSelect.addValidators(Validators.required)
      } else {
        this.formulario.controls.formUsd.clearValidators()
        this.formulario.controls.tipoventaSelect.clearValidators()
      }
      let tablaActiva = this.getGoldTable(this.formulario.value.reinoSelect)
      this.formulario.controls.estadoSelect.clearValidators
      this.formulario.controls.formOro.clearValidators()
      this.formulario.controls.formOro.addValidators(Validators.min(1))
      this.formulario.controls.formOro.addValidators(Validators.max(tablaActiva.inventario))
      this.max = tablaActiva.inventario
    } else {
      this.formulario.controls.tipoventaSelect.clearValidators()
      this.formulario.controls.formUsd.clearValidators()
      this.formulario.controls.formOro.clearValidators()
      this.formulario.controls.estadoSelect.addValidators(Validators.required)
      this.formulario.controls.formOro.addValidators(Validators.min(1));
      this.formulario.controls.formOro.addValidators(Validators.required);
    }
    this.formulario.markAsDirty()
    this.formulario.controls.formOro.updateValueAndValidity()
  }

  modificarMax() {
    if (this.formulario.controls.tipomovSelect.value != 'ingreso') {
      let tablaActiva = this.getGoldTable(this.formulario.value.reinoSelect)
      this.formulario.controls.formOro.clearValidators()
      this.formulario.controls.formOro.addValidators(Validators.min(1));
      this.formulario.controls.formOro.addValidators(Validators.required);
      this.formulario.controls.formOro.addValidators(Validators.max(tablaActiva.inventario))
      this.max = tablaActiva.inventario
    }
    this.formulario.markAsDirty()
    this.formulario.controls.formOro.updateValueAndValidity()
  }


  async agregarMovimiento() {
    if (!this.modalAbierto) {
      return;
    }
    if (!this.formulario.valid) {
      this._snackBar.open('Por favor revisa los datos', 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return ;
    }

    this.cargando = true;
    this.formulario.controls.formOro.markAllAsTouched()
    let fecha: Date = new Date()

    let movimiento: Movimiento = {
      uid: JSON.parse(localStorage.getItem('userData')!).uid,
      cantOro: this.formulario.value.formOro!,
      tipoMov: this.formulario.value.tipomovSelect!,
      reino: this.formulario.value.reinoSelect!,
      fecha: fecha
    }

    let goldTableNueva: GoldTable = this.getGoldTable(movimiento.reino)
    let indexTable = this.inventarios.indexOf(goldTableNueva);

    movimiento.reinoString = goldTableNueva.reinoString

    switch (movimiento.tipoMov) {
      case 'ingreso': {
        if (this.formulario.value.estadoSelect == 'pendiente') {
          goldTableNueva.pendiente += movimiento.cantOro
          goldTableNueva.total += movimiento.cantOro
        } else {
          goldTableNueva.inventario += movimiento.cantOro
          goldTableNueva.total += movimiento.cantOro
        }
        break;
      }
      case 'venta': {
        goldTableNueva.inventario -= movimiento.cantOro
        goldTableNueva.total -= movimiento.cantOro
        movimiento.cantUsd = this.formulario.value.formUsd!
        break;
      }
      case 'retiro': {
        goldTableNueva.inventario -= movimiento.cantOro
        goldTableNueva.total -= movimiento.cantOro
        break;
      }
    }

    this.inventarios[indexTable] = goldTableNueva;

    this.goldtableService.guardarTablas(this.inventarios);
    if (await this.movService.guardarMovimiento(movimiento)) {
      this._snackBar.open('Movimiento agregado con éxito!', 'OK', {
        panelClass: 'snackbar-success',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      this.cerrarModal()
    } else {
      this._snackBar.open('Error al agregar movimiento', 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
    this.cargando = false;

  }

  getGoldTable(reino: string): GoldTable{
    let encontrado = this.inventarios.find((tabla) => { return tabla.reino === reino })!
    return encontrado
  }
}
