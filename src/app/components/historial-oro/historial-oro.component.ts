import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MovimientoService } from '../../services/movimiento.service';
import { Movimiento } from 'src/app/models/movimiento.model';
import { GoldTable } from 'src/app/models/goldtable.model';
import { Subscription } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { GoldTableService } from '../../services/goldtable.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { Moment } from 'moment';
import { MatDatepicker } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import {MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter'
import { UserPref } from '../../models/userpref.model';
import { UserPrefService } from '../../services/userpref.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalConfirmComponent } from './modal-confirm/modal-confirm.component';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MMMM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-historial-oro',
  templateUrl: './historial-oro.component.html',
  styleUrls: ['./historial-oro.component.css'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class HistorialOroComponent implements OnInit, AfterViewInit{
  displayedColumns = ['fecha', 'reinoString', 'cantOro', 'cantUsd', 'tipoMov', 'eliminar'];
  movimientos!: Movimiento[]
  movimientos8horas!: Movimiento[]
  movimientoSub!: Subscription;
  movimientosFiltradosPorMes: Movimiento[];
  movimientosFiltradosPorCheck: Movimiento[];
  goldTableSub!: Subscription;
  inventarios: GoldTable[] = [];
  cargando = false;
  date = new FormControl(moment());
  userPref!: UserPref
  userPrefSub!: Subscription;
  tiposMov: string[] = ['ingreso', 'venta', 'retiro', 'confirm']
  formTiposMov = this._formBuilder.group({
    ingreso: true,
    venta: true,
    retiro: true,
    confirm: false,
  });

  oroMensual: number;
  oroVendido: number;
  usdConseguidos: number;
  usdX100K: number;

  dataSource = new MatTableDataSource<Movimiento>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private movimientoService: MovimientoService,
    private loginService: LoginService,
    private goldtableService: GoldTableService,
    private _snackBar: MatSnackBar,
    private userPrefService: UserPrefService,
    private _formBuilder: FormBuilder,
    public dialog: MatDialog
  ) {
    this.date.value!.locale('es');
    this.oroMensual = 0
    this.oroVendido = 0
    this.usdX100K = 0
    this.usdConseguidos = 0
    this.movimientosFiltradosPorMes = [];
    this.movimientosFiltradosPorCheck = [];
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

          console.log('subscribe movimientos');
          this.movimientoService.cargarMovimientos().subscribe(
            (resultado) => {
              this.movimientos = resultado
              this.movimientos[0].eliminable = true;
              console.log(this.movimientos);

              this.filtrarMovimientos(this.date.value!);
              this.dataSource = new MatTableDataSource<Movimiento>(this.movimientosFiltradosPorMes);
              this.dataSource.sort = this.sort;
              this.paginator._intl.itemsPerPageLabel = 'Movimientos por página'
              this.dataSource.paginator = this.paginator;
              this.filtrarTipoMov();
              this.ActualizarMetricas()
            }
          )

          console.log('subscribe userpref');
          this.userPrefSub = this.userPrefService
            .cargarUserPref()
            .subscribe((userpref) => {
              if (userpref) {
                this.userPref = userpref;
              }
          });

        } else {
          this.goldTableSub.unsubscribe()
          console.log('unsubscribe goldtable');
          this.userPrefSub.unsubscribe()
          console.log('unsubscribe goldtable');
          this.movimientoSub.unsubscribe()
          console.log('unsubscribe movimientos');
        }
      }
    )

  }

  filtrarTipoMov() {
    let tiposMovFiltrados: string[] = [];

    this.tiposMov.forEach(
      (tipomov) => {
        if (this.formTiposMov.get(tipomov)!.value == true) {
          tiposMovFiltrados.push(tipomov);
        }
      }
    )


    this.movimientosFiltradosPorCheck = this.movimientosFiltradosPorMes.filter((resultado) => {
      let res = tiposMovFiltrados.some((tipomov) => {
        return tipomov == resultado.tipoMov
      })
      return res
    })


    this.dataSource = new MatTableDataSource<Movimiento>(this.movimientosFiltradosPorCheck);
    this.dataSource.sort = this.sort;
    this.paginator._intl.itemsPerPageLabel = 'Movimientos por página'
    this.dataSource.paginator = this.paginator;
  }

  filtrarMovimientos(fechaFiltrada: Moment) {
    this.movimientosFiltradosPorMes = this.movimientos.filter(
      (resultado) => {
        return moment(resultado.fechaAjustada).locale('es').isSame(fechaFiltrada, 'month') && moment(resultado.fechaAjustada).locale('es').isSame(fechaFiltrada, 'year')
      }
    )
  }

  aumentarMes() {
    this.date.value!.add(1, 'month');
    this.filtrarMovimientos(this.date.value!);
    this.filtrarTipoMov();

    const ctrlValue = this.date.value!;
    ctrlValue.month(this.date.value!.month());
    ctrlValue.year(this.date.value!.year());
    this.date.setValue(ctrlValue);
    this.ActualizarMetricas()
  }

  disminuirMes() {
    this.date.value!.subtract(1, 'month');
    this.filtrarMovimientos(this.date.value!);
    this.filtrarTipoMov();

    const ctrlValue = this.date.value!;
    ctrlValue.month(this.date.value!.month());
    ctrlValue.year(this.date.value!.year());
    this.date.setValue(ctrlValue);
    this.ActualizarMetricas()
  }

  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.date.value!;
    ctrlValue.month(normalizedMonthAndYear.month());
    ctrlValue.year(normalizedMonthAndYear.year());
    this.date.setValue(ctrlValue);

    this.filtrarMovimientos(this.date.value!);
    this.filtrarTipoMov();
    this.dataSource = new MatTableDataSource<Movimiento>(this.movimientosFiltradosPorCheck);
    this.dataSource.sort = this.sort;
    this.paginator._intl.itemsPerPageLabel = 'Movimientos por página'
    this.dataSource.paginator = this.paginator;

    datepicker.close();
  }

  ngAfterViewInit() {
  }

  abrirModalEliminar(movimiento: Movimiento) {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      width: '400px',
      data: movimiento,
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      console.log('The dialog was closed' + result);
      if (result == true) {
        this.eliminarMovimiento(movimiento);
      }
    });

  }

  async eliminarMovimiento(movimiento: Movimiento) {
    if (movimiento.eliminable) {
      this.cargando = true;
      let goldTableNueva: GoldTable = this.getGoldTable(movimiento.reino)
      let indexTable = this.inventarios.indexOf(goldTableNueva);

      if (movimiento.tipoMov == 'ingreso') {
        if (movimiento.fuente == 'inventario') {
          goldTableNueva.inventario -= movimiento.cantOro
          goldTableNueva.total -= movimiento.cantOro
        } else {
          goldTableNueva.pendiente -= movimiento.cantOro
          goldTableNueva.total -= movimiento.cantOro
        }
      } else {
        if (movimiento.tipoMov == 'venta' || movimiento.tipoMov == 'retiro') {
          goldTableNueva.inventario += movimiento.cantOro
          goldTableNueva.total += movimiento.cantOro
        } else {
          // Es una confirmación
          goldTableNueva.inventario -= movimiento.cantOro
          goldTableNueva.pendiente += movimiento.cantOro
        }
      }

      this.inventarios[indexTable] = goldTableNueva;

      if (await this.goldtableService.guardarTablas(this.inventarios)) {
        if (await this.movimientoService.eliminarMovimiento(movimiento.id!)) {
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
    }
  }

  getValorUSD(oro: number) {
    if (this.usdX100K) {
      return oro / 100 * this.usdX100K;
    }
    return oro / 100 * (this.userPref ? this.userPref.usdx100K : 0)!;
  }

  getGoldTable(reino: string): GoldTable{
    let encontrado = this.inventarios.find((tabla) => { return tabla.reino === reino })!
    return encontrado
  }

  ActualizarMetricas() {
    this.ActualizarOroMensual()
    this.ActualizarOroVendido()
  }

  ActualizarOroMensual() {
    let total = 0;
    this.movimientosFiltradosPorMes.forEach((tabla) => {
      if (tabla.tipoMov == 'ingreso') {
        total += tabla.cantOro
      } else {
        if (tabla.tipoMov == 'retiro') {
          total -= tabla.cantOro
        }
      }
    })
    this.oroMensual = total;
  }

  ActualizarOroVendido() {
    let totalOro = 0;
    let totalUsd = 0;
    this.movimientosFiltradosPorMes.forEach((tabla) => {
      if (tabla.tipoMov == 'venta') {
        totalOro += tabla.cantOro
        totalUsd += tabla.cantUsd!
      }
    })
    this.oroVendido = totalOro;
    this.usdConseguidos = totalUsd;
    if (totalOro != 0) {
      this.usdX100K = totalUsd / (totalOro / 100);
    } else {
      this.usdX100K = 0;
    }
  }

  ngOnInit(): void {

  }
}
