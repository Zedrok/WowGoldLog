import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
import { GoldTable } from 'src/app/models/goldtable.model';
import { Movimiento } from 'src/app/models/movimiento.model';
import { UserPref } from 'src/app/models/userpref.model';
import { LoginService } from '../../services/login.service';
import { GoldTableService } from '../../services/goldtable.service';
import { MovimientoService } from '../../services/movimiento.service';
import { UserPrefService } from '../../services/userpref.service';

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

export interface DataSourceResumen{
  fecha?: Date,
  texto?: string
  cantOro: number,
  cantUsd: number,
}

export interface DataSourceSemanal{
  semana?: string
  cantOro: number,
  cantUsd: number,
}

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.css'],
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
export class ResumenComponent implements OnInit {
  displayedColumns = ['fecha', 'cantOro', 'cantUsd'];
  movimientos!: Movimiento[]
  movimientoSub!: Subscription;
  movimientosFiltradosPorMes: Movimiento[];
  movimientosPorDia: DataSourceResumen[];
  movimientosPorSemana: DataSourceSemanal[];
  goldTableSub!: Subscription;
  inventarios: GoldTable[] = [];
  date = new FormControl(moment());
  userPref!: UserPref
  userPrefSub!: Subscription;

  oroMensual: number;
  oroVendido: number;
  usdConseguidos: number;
  usdX100K: number;
  maxDate = new Date();

  dataSource = new MatTableDataSource<DataSourceResumen>([]);
  dataSourceSemanal = new MatTableDataSource<DataSourceSemanal>([]);

  constructor(
    private loginService: LoginService,
    private goldtableService: GoldTableService,
    private movimientoService: MovimientoService,
    private userPrefService: UserPrefService
  ) {
    this.date.value!.locale('es');
    this.movimientosFiltradosPorMes = [];
    this.movimientosPorDia = [];
    this.movimientosPorSemana = [];
    this.oroMensual = 0;
    this.oroVendido = 0;
    this.usdConseguidos = 0;
    this.usdX100K = 0;
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

          console.log('subscribe userpref');
          this.userPrefSub = this.userPrefService
            .cargarUserPref()
            .subscribe((userpref) => {
              if (userpref) {
                this.userPref = userpref;
              }
          });

          console.log('subscribe movimientos');
          this.movimientoService.cargarMovimientos().subscribe(
            (resultado) => {
              this.movimientos = resultado
              this.filtrarMovimientos(this.date.value!);
              this.dataSource = new MatTableDataSource<DataSourceResumen>(this.movimientosPorDia);
            }
          )

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

  ngOnInit(): void {
  }

  prepararDias() {
    this.date.clearValidators()
    moment.updateLocale('es', {
      week : {
          dow : 2,
          doy : 6
       }
    });
    this.date.value!.locale('es')

    if (moment(new Date()).get('M') == this.date.value!.get('M')) {
      this.date.value!.set('date', moment(new Date).get('D'))
    } else {
      this.date.value!.set('date', this.date.value!.daysInMonth());
    }

    let currentDate = this.date.value!

    this.movimientosPorDia = [];
    for (let dia = this.date.value!.get('D'); dia > 1; dia--){
      let totalOro = 0;
      let totalUsd = 0;
      this.movimientosFiltradosPorMes.forEach(
        (movimiento) => {
          if (moment(movimiento.fecha).get('D') == dia) {
            if (movimiento.tipoMov == 'ingreso') {
              totalOro += movimiento.cantOro;
              totalUsd += this.getValorUSD(movimiento.cantOro);
            } else {
              if (movimiento.tipoMov == 'retiro') {
                totalOro -= movimiento.cantOro;
                totalUsd -= this.getValorUSD(movimiento.cantOro);
              }
            }
          }
        }
      )
      this.movimientosPorDia.push({
        fecha: currentDate.toDate(),
        cantOro: totalOro,
        cantUsd: totalUsd
      })
      currentDate.subtract(1, 'day');
    }
    let totalOro = 0;
    let totalUsd = 0;
    this.movimientosFiltradosPorMes.forEach(
      (movimiento) => {
        if (moment(movimiento.fecha).get('D') == 1) {
          if (movimiento.tipoMov == 'ingreso') {
            totalOro += movimiento.cantOro;
            totalUsd += this.getValorUSD(movimiento.cantOro);
          } else {
            if (movimiento.tipoMov == 'retiro') {
              totalOro -= movimiento.cantOro;
              totalUsd -= this.getValorUSD(totalOro);
            }
          }
        }
      }
    )
    this.movimientosPorDia.push({
      fecha: currentDate.toDate(),
      cantOro: totalOro,
      cantUsd: totalUsd
    })
    if (moment(new Date()).get('M') == this.date.value!.get('M')) {
      this.date.value!.set('date', moment(new Date).get('D'))
    } else {
      this.date.value!.set('date', this.date.value!.daysInMonth());
    }
    this.crearResumenSemanal();
  }

  crearResumenSemanal() {
    this.movimientosPorSemana = [];
    let currentDate = moment(this.date.value).locale('es')
    let totalSemana = 0;
    this.movimientosPorDia.forEach((dia) => {
      if (moment(dia.fecha).locale('es').get('week') == currentDate.get('week')) {
        totalSemana += dia.cantOro;
        if (moment(dia.fecha).locale('es').get('D') == 1) {
          this.movimientosPorSemana.push(
            {
              cantOro: totalSemana,
              cantUsd: this.getValorUSD(totalSemana),
              semana: 'Semana '+moment(dia.fecha).locale('es').format('DD/MM') + ' al ' + currentDate.endOf('week').format('DD/MM')
            }
          )
        }
      } else {
        if (moment(new Date()).get('M') == this.date.value!.get('M')) {
          this.movimientosPorSemana.push(
            {
              cantOro: totalSemana,
              cantUsd: this.getValorUSD(totalSemana),
              semana: 'Semana '+currentDate.startOf('week').format('DD/MM') + ' al ' + currentDate.endOf('week').format('DD/MM')
            }
          )
        } else {
          if (this.movimientosPorSemana.length == 0) {
            this.movimientosPorSemana.push(
              {
                cantOro: totalSemana,
                cantUsd: this.getValorUSD(totalSemana),
                semana: 'Semana '+currentDate.startOf('week').format('DD/MM') + ' al ' + currentDate.daysInMonth()+'/'+currentDate.format('MM')
              }
            )
          } else {
            this.movimientosPorSemana.push(
              {
                cantOro: totalSemana,
                cantUsd: this.getValorUSD(totalSemana),
                semana: 'Semana '+currentDate.startOf('week').format('DD/MM') + ' al ' + currentDate.endOf('week').format('DD/MM')
              }
            )
          }
              this.date.value!.set('date', this.date.value!.daysInMonth());
        }

        currentDate.subtract(1, 'week');
        totalSemana = 0;
      }
    });
    this.dataSourceSemanal = new MatTableDataSource<DataSourceSemanal>(this.movimientosPorSemana);
  }

  filtrarMovimientos(fechaFiltrada: moment.Moment) {
    this.movimientosFiltradosPorMes = this.movimientos.filter(
      (resultado) => {
        return moment(resultado.fecha).isSame(fechaFiltrada, 'month') && moment(resultado.fecha).isSame(fechaFiltrada, 'year')
      }
    )
    this.prepararDias();
    this.dataSource = new MatTableDataSource<DataSourceResumen>(this.movimientosPorDia);
  }

  aumentarMes() {
    let currentDate = moment(new Date())
    if (currentDate.get('M') != this.date.value?.get('M')) {
      this.date.value!.add(1, 'month');

      const ctrlValue = this.date.value!;
      ctrlValue.set('date', this.date.value!.daysInMonth());
      ctrlValue.set('month', this.date.value!.month());
      ctrlValue.set('year', this.date.value!.year());
      this.date.setValue(ctrlValue);

      this.filtrarMovimientos(this.date.value!);
    }
  }

  disminuirMes() {
    this.date.value!.subtract(1, 'month');

    const ctrlValue = this.date.value!;
    ctrlValue.set('date', this.date.value!.daysInMonth());
    ctrlValue.set('month', this.date.value!.month());
    ctrlValue.set('year', this.date.value!.year());
    this.date.setValue(ctrlValue);

    this.filtrarMovimientos(this.date.value!);

  }

  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.date.value!;
    ctrlValue.month(normalizedMonthAndYear.month());
    ctrlValue.year(normalizedMonthAndYear.year());
    this.date.setValue(ctrlValue);

    this.filtrarMovimientos(this.date.value!);
    this.prepararDias();

    this.dataSource = new MatTableDataSource<DataSourceResumen>(this.movimientosPorDia);

    datepicker.close();
  }

  getValorUSD(oro: number) {
    return (oro / 100) * this.userPref.usdx100K;
  }

}
