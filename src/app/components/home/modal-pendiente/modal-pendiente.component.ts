import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GoldTableService } from 'src/app/services/goldtable.service';
import { GoldTable } from '../../../models/goldtable.model';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { LoginService } from '../../../services/login.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Movimiento } from 'src/app/models/movimiento.model';
import { MovimientoService } from '../../../services/movimiento.service';
import * as moment from 'moment';

@Component({
  selector: 'app-modal-pendiente',
  templateUrl: './modal-pendiente.component.html',
  styleUrls: ['./modal-pendiente.component.css']
})
export class ModalPendienteComponent implements OnInit {
  formOro: FormControl = new FormControl('');
  modalAbierto = true;
  goldTableSub!: Subscription;
  goldTable: GoldTable;
  inventarios: GoldTable[] = []
  cargando = false;

  constructor(
    private goldtableService: GoldTableService,
    public dialogRef: MatDialogRef<ModalPendienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GoldTable,
    private loginService: LoginService,
    private _snackBar: MatSnackBar,
    private movimientoService: MovimientoService
  ) {
    this.goldTable = data;
    this.formOro.addValidators(Validators.min(1))
    this.formOro.addValidators(Validators.max(this.goldTable.pendiente))
    this.formOro.addValidators(Validators.required)

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
        } else {
          this.goldTableSub.unsubscribe()
          console.log('unsubscribe goldtable');
        }
      }
    )
  }
  ngOnInit(): void {
    console.log(this.goldTable)
    this.setValorMaximo()
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.dialogRef.close();
  }

  async confirmarOro() {
    console.log(this.modalAbierto, this.formOro.valid);

    this.formOro.markAsTouched()
    if (!this.modalAbierto || !this.formOro.valid ) {
      return;
    }

    this.cargando = true;
    this.goldTable = this.getGoldTable(this.goldTable.reino)
    let indexTable = this.inventarios.indexOf(this.goldTable);
    let fechaAjustada: Date = moment(new Date()).subtract(8, 'hours').toDate()

    let movimiento: Movimiento = {
      uid: JSON.parse(localStorage.getItem('userData')!).uid,
      cantOro: this.formOro.value!,
      tipoMov: 'confirm'!,
      reino: this.goldTable.reino!,
      reinoString: this.goldTable.reinoString!,
      fecha: new Date(),
      fechaAjustada: fechaAjustada
    }

    this.goldTable.inventario += this.formOro.value;
    this.goldTable.pendiente -= this.formOro.value;

    this.inventarios[indexTable] = this.goldTable;

    if (await this.goldtableService.guardarTablas(this.inventarios)) {
      if (await this.movimientoService.guardarMovimiento(movimiento)) {
        this._snackBar.open('Oro confirmado con éxito!', 'OK', {
          panelClass: 'snackbar-success',
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      } else {
        this._snackBar.open('Error al confirmar oro', 'OK', {
          panelClass: 'snackbar-error',
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    } else {
      this._snackBar.open('Error al guardar tabla', 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
    this.cargando = false;
    this.cerrarModal()
  }

  getGoldTable(reino: string): GoldTable{
    let encontrado = this.inventarios.find((tabla) => { return tabla.reino === reino })!
    return encontrado
  }

  setValorMaximo() {
    this.formOro.setValue(this.goldTable.pendiente);
  }
}

