import { Component, OnInit, ViewChild } from '@angular/core';
import { StatInventario } from '../../models/statInventario.model';
import { GoldTableService } from '../../services/goldtable.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ChartComponent,
} from 'ng-apexcharts';
import { Subscription } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { UserPrefService } from '../../services/userpref.service';
import { UserPref } from 'src/app/models/userpref.model';
import { MatDialog } from '@angular/material/dialog';
import { ModalTokenComponent } from './modal-token/modal-token.component';
import { ModalUsdComponent } from './modal-usd/modal-usd.component';
import { GoldTable } from '../../models/goldtable.model';
import { MovimientoService } from '../../services/movimiento.service';
import { Movimiento } from '../../models/movimiento.model';
import * as moment from 'moment';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  userPref!: UserPref;
  userPrefSub!: Subscription;
  inventarios: GoldTable[] = [];
  goldTableSub!: Subscription;
  movimientos: Movimiento[] = [];
  movimientoSub!: Subscription;

  statInventario: StatInventario;

  constructor(
    private goldtableService: GoldTableService,
    private loginService: LoginService,
    private userPrefService: UserPrefService,
    public dialog: MatDialog,
    private movimientoService: MovimientoService,
  ) {
    this.statInventario = {
      oroDiario: 0,
      oroMensual: 0,
      oroSemanaAnterior: 0,
      oroSemanal: 0,
      total: 0,
    };

    this.userPref = {
      usdx100K: 5,
      valorToken: 227000,
    };

    loginService.getLoginStatus().subscribe((status) => {
      if (status) {
        console.log('subscribe userpref');
        this.userPrefSub = this.userPrefService
          .cargarUserPref()
          .subscribe((userpref) => {
            if (userpref) {
              this.userPref = userpref;
            }
          });
        console.log('subscribe movimientos');
        this.goldTableSub = this.goldtableService
          .cargarGoldTables()
          .subscribe((resultado) => {
            if (resultado != null) {
              this.goldtableService.cargarNombreReinos(resultado);
              this.inventarios = resultado;
            }
          });
        console.log('subscribe movimientos');
        this.movimientoSub = this.movimientoService
          .cargarMovimientos()
          .subscribe((resultado) => {
            if (resultado != null) {
              this.movimientos = resultado;
              this.actualizarStatInventario(this.movimientos);
            }
          });
      } else {
        this.userPrefSub.unsubscribe();
        console.log('unsubscribe userpref');
        this.goldTableSub.unsubscribe();
        console.log('unsubscribe goldtable');
        this.movimientoSub.unsubscribe();
        console.log('unsubscribe movimiento');
      }
    });
  }

  actualizarStatInventario(movimientos: Movimiento[]) {
    if (this.userPref) {
      this.ActualizarOroDiario(movimientos)
      this.ActualizarOroSemanal(movimientos)
      this.ActualizarPromSemanaAnterior(movimientos)
      this.ActualizarOroMensual(movimientos)
    }
  }

  ActualizarOroMensual(movimientos: Movimiento[]) {
    let currentDate = moment();
    let filtrados = movimientos.filter((movimiento) => {
      return moment(movimiento.fecha).isSame(currentDate, 'month');
    })
    let total = 0;
    filtrados.forEach((tabla) => {
      if (tabla.tipoMov == 'ingreso') {
        total += tabla.cantOro
      } else {
        if (tabla.tipoMov == 'retiro') {
          total -= tabla.cantOro
        }
      }
    })
    this.statInventario!.oroMensual = total;
  }

  ActualizarOroSemanal(movimientos: Movimiento[]) {

    moment.updateLocale('es', {
      week : {
          dow : 2,
          doy : 6
       }
    });

    let filtrados = movimientos.filter((movimiento) => {
      let currentDate = moment().locale('es');
      let momentFecha = moment(movimiento.fecha).locale('es')
      return momentFecha.isSame(currentDate, 'week');
    })
    let total = 0;
    filtrados.forEach((tabla) => {
      if (tabla.tipoMov == 'ingreso') {
        total += tabla.cantOro
      } else {
        if (tabla.tipoMov == 'retiro') {
          total -= tabla.cantOro
        }
      }
    })
    this.statInventario!.oroSemanal = total;
  }

  ActualizarPromSemanaAnterior(movimientos: Movimiento[]) {

    moment.updateLocale('es', {
      week : {
          dow : 2,
          doy : 6
       }
    });

    let filtrados = movimientos.filter((movimiento) => {
      let momentFecha = moment(movimiento.fecha).locale('es')
      let currentDate = moment().locale('es')
      return momentFecha.isSame(currentDate.subtract(1, 'week'), 'week');
    })

    console.log(filtrados)

    let total = 0;
    filtrados.forEach((tabla) => {
      if (tabla.tipoMov == 'ingreso') {
        total += tabla.cantOro
      } else {
        if (tabla.tipoMov == 'retiro') {
          total -= tabla.cantOro
        }
      }
    })
    this.statInventario!.oroSemanaAnterior = total;
  }

  ActualizarOroDiario(movimientos: Movimiento[]){
    let currentDate = moment();
    let filtrados = movimientos.filter((movimiento) => {
      return moment(movimiento.fecha).isSame(currentDate, 'day');
    })
    let total = 0;
    filtrados.forEach((tabla) => {
      if (tabla.tipoMov == 'ingreso') {
        total += tabla.cantOro
      } else {
        if (tabla.tipoMov == 'retiro') {
          total -= tabla.cantOro
        }
      }
    })
    this.statInventario!.oroDiario = total;
  }

  getValorUSD(oro: number) {
    return oro / 100 * (this.userPref?this.userPref.usdx100K:0)!;
  }

  getSumaTotal() {
    let total = 0
    this.inventarios.forEach(
      (inventario) => {
        total += inventario.total;
      }
    )
    return total;
  }

  openModalToken(): void {
    const dialogRef = this.dialog.open(ModalTokenComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('modal cerrado');
    });
  }

  openModalUsd(): void {
    const dialogRef = this.dialog.open(ModalUsdComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('modal cerrado');
    });
  }

  ngOnInit(): void {
    // console.log(JSON.parse(localStorage.getItem('userData')!));
    // console.log(JSON.parse(localStorage.getItem('userAfsData')!));
  }
}
