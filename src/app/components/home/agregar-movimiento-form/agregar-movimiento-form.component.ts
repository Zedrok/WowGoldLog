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
import * as moment from 'moment';

@Component({
  selector: 'app-agregar-movimiento-form',
  templateUrl: './agregar-movimiento-form.component.html',
  styleUrls: ['./agregar-movimiento-form.component.css'],
})
export class AgregarMovimientoForm {
  inventarios: GoldTable[] = [];
  inventariosActivos: GoldTable[] = [];
  arrayReinos: string[] = JSON.parse(localStorage.getItem('userData')!).reinos
    ? JSON.parse(localStorage.getItem('userData')!).reinos
    : [];
  max = 0;
  modalAbierto = true;
  cargando = false;
  oroTransformado = 0;
  toFixed = (n: number, fixed: number): number => ~~(Math.pow(10, fixed) * n) / Math.pow(10, fixed);
  formulario = new FormGroup(
    {
      reinoSelect: new FormControl( this.arrayReinos[0], [Validators.required]),
      tipomovSelect: new FormControl('ingreso', [Validators.required]),
      estadoSelect: new FormControl('pendiente', [Validators.required]),
      tipoventaSelect: new FormControl('trade'),
      reinoObjetivoSelect: new FormControl( this.arrayReinos[1] ),
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
    private userPrefService: UserPrefService,
    @Inject(MAT_DIALOG_DATA) private data?: any
  ) {
    if (this.data) {
      this.formulario.controls.estadoSelect.setValue(this.data.tipoMov);
      this.formulario.controls.reinoSelect.setValue(this.data.reino);
    }
    // Activar suscripción a la base de datos de las tablas
    loginService.getLoginStatus().subscribe(
      (status) => {
        if (status) {
          console.log('subscribe goldtable');
          this.goldTableSub = this.goldtableService.cargarGoldTables().subscribe(
            (resultado) => {
              if (resultado != null) {
                this.inventarios = resultado;
                this.agregarTablasFaltantes(this.inventarios);
                this.goldtableService.cargarNombreReinos(this.inventarios);
                this.inventariosActivos = this.filtrarTablasUsuario(this.inventarios);
              } else {
                this.agregarTablasFaltantes(this.inventarios);
                this.inventariosActivos = this.filtrarTablasUsuario(this.inventarios);
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

  agregarTablasFaltantes(tablas: GoldTable[]) {
    this.arrayReinos.forEach((reino) => {
      if (
        tablas.filter((tabla) => reino === tabla.reino)
          .length == 0
      ) {
        tablas.push({
          inventario: 0,
          pendiente: 0,
          reino: reino,
          total: 0,
        });
      }
    });
  }

  filtrarTablasUsuario(tablas: GoldTable[]) {
    let datosFiltrados = tablas.filter((tabla) =>
      this.arrayReinos.some((reino) => reino === tabla.reino)
    );

    if (datosFiltrados.length == 0) {
      return [];
    }

    datosFiltrados.sort((tabla1, tabla2) => {
      if (tabla1.reino > tabla2.reino) {
        return 1;
      }
      if (tabla1.reino < tabla2.reino) {
        return -1;
      }
      return 0;
    });
    return datosFiltrados;
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
    switch (this.formulario.value.tipomovSelect) {
      case 'venta':
        this.formulario.controls.formUsd.addValidators(Validators.required)
        this.formulario.controls.formUsd.addValidators(Validators.min(1))
        this.formulario.controls.tipoventaSelect.addValidators(Validators.required)
        this.agregarValidacionMax();
        break;
      case 'retiro':
        this.formulario.controls.formUsd.clearValidators()
        this.formulario.controls.tipoventaSelect.clearValidators()
        this.agregarValidacionMax();
        break;
      case 'traspaso':
        this.formulario.controls.formUsd.clearValidators()
        this.formulario.controls.tipoventaSelect.clearValidators()
        this.agregarValidacionMax();
        break;
      case 'ingreso':
        this.formulario.controls.tipoventaSelect.clearValidators()
        this.formulario.controls.formUsd.clearValidators()
        this.formulario.controls.formOro.clearValidators()
        this.formulario.controls.estadoSelect.addValidators(Validators.required)
        this.formulario.controls.formOro.addValidators(Validators.min(1));
        this.formulario.controls.formOro.addValidators(Validators.required);
        break;
    }
    this.formulario.markAsDirty()
    this.formulario.controls.formOro.updateValueAndValidity()
  }

  agregarValidacionMax() {
    let tablaActiva = this.getGoldTable(this.formulario.value.reinoSelect!)
    this.formulario.controls.estadoSelect.clearValidators
    this.formulario.controls.formOro.clearValidators()
    this.formulario.controls.formOro.addValidators(Validators.min(1))
    this.formulario.controls.formOro.addValidators(Validators.max(tablaActiva.inventario))
    this.formulario.controls.formOro.setValue(tablaActiva.inventario)
    this.max = tablaActiva.inventario
  }

  modificarMax() {
    if (this.formulario.controls.tipomovSelect.value != 'ingreso') {
      let tablaActiva = this.getGoldTable(this.formulario.value.reinoSelect!)
      this.formulario.controls.formOro.clearValidators()
      this.formulario.controls.formOro.addValidators(Validators.min(1));
      this.formulario.controls.formOro.addValidators(Validators.required);
      this.formulario.controls.formOro.addValidators(Validators.max(tablaActiva.inventario))
      this.formulario.controls.formOro.setValue(tablaActiva.inventario)
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
    let fechaAjustada: Date = moment(new Date()).subtract(8, 'hours').toDate()

    let movimiento: Movimiento = {
      uid: JSON.parse(localStorage.getItem('userData')!).uid,
      cantOro: this.formulario.value.formOro!,
      tipoMov: this.formulario.value.tipomovSelect!,
      reino: this.formulario.value.reinoSelect!,
      fecha: fecha,
      fechaAjustada: fechaAjustada
    }

    let goldTableOrigen: GoldTable = this.getGoldTable(movimiento.reino)
    let indexTable = this.inventarios.indexOf(goldTableOrigen);

    movimiento.reinoString = goldTableOrigen.reinoString

    switch (movimiento.tipoMov) {
      case 'ingreso': {
        if (this.formulario.value.estadoSelect == 'pendiente') {
          goldTableOrigen.pendiente += movimiento.cantOro
          goldTableOrigen.total += movimiento.cantOro
          movimiento.fuente = 'pendiente'
        } else {
          goldTableOrigen.inventario += movimiento.cantOro
          goldTableOrigen.total += movimiento.cantOro
          movimiento.fuente = 'inventario'
        }
        break;
      }
      case 'venta': {
        goldTableOrigen.inventario -= movimiento.cantOro
        goldTableOrigen.total -= movimiento.cantOro
        movimiento.cantUsd = this.formulario.value.formUsd!
        break;
      }
      case 'retiro': {
        goldTableOrigen.inventario -= movimiento.cantOro
        goldTableOrigen.total -= movimiento.cantOro
        break;
      }
      case 'traspaso': {

        if (this.formulario.value.reinoSelect == this.formulario.value.reinoObjetivoSelect) {
          this._snackBar.open('Por favor revisa los datos', 'OK', {
            panelClass: 'snackbar-error',
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          return;
        }

        let goldTableObjetivo = this.getGoldTable(this.formulario.value.reinoObjetivoSelect!)
        let indexObjetivo = this.inventarios.indexOf(goldTableObjetivo);

        goldTableOrigen.inventario -= this.formulario.value.formOro!
        goldTableOrigen.total -= this.formulario.value.formOro!

        goldTableObjetivo.inventario += this.toFixed(this.formulario.value.formOro! * 0.95, 0);
        goldTableObjetivo.total += this.toFixed(this.formulario.value.formOro! * 0.95, 0);

        movimiento.reinoObjetivo = goldTableObjetivo.reino
        movimiento.reinoObjetivoString = goldTableObjetivo.reinoString

        this.inventarios[indexObjetivo] = goldTableObjetivo;
      }
    }

    this.inventarios[indexTable] = goldTableOrigen;

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
