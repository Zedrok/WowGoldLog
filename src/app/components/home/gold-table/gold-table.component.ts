import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { GoldTable } from 'src/app/models/goldtable.model';
import { GoldTableService } from 'src/app/services/goldtable.service';
import { AgregarMovimientoForm } from '../agregar-movimiento-form/agregar-movimiento-form.component';
import { ReinosService } from '../../../services/reinos.service';
import { ModalPendienteComponent } from '../modal-pendiente/modal-pendiente.component';
import { LoginService } from '../../../services/login.service';
import { Subscription } from 'rxjs';
import { StatInventario } from '../../../models/statInventario.model';
import { MovimientoService } from '../../../services/movimiento.service';
import { Movimiento } from '../../../models/movimiento.model';
import * as moment from 'moment';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UserPref } from 'src/app/models/userpref.model';
import { UserPrefService } from '../../../services/userpref.service';
import {Clipboard} from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-gold-table',
  templateUrl: './gold-table.component.html',
  styleUrls: ['./gold-table.component.css'],
})
export class GoldTableComponent implements OnInit {
  inventarios: GoldTable[] = [];
  statInventario!: StatInventario
  movimientoSub!: Subscription
  movimientos: Movimiento[] = [];
  goldTableSub!: Subscription;
  displayedColumns = ['reino', 'inventario', 'pendiente', 'total'];
  dataSource = new MatTableDataSource<GoldTable>([]);
  userPref!: UserPref;
  userPrefSub!: Subscription;
  inventariosActivos: GoldTable[] = [];
  arrayReinos: string[] = JSON.parse(localStorage.getItem('userData')!).reinos
  ? JSON.parse(localStorage.getItem('userData')!).reinos
  : [];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private goldtableService: GoldTableService,
    private reinosService: ReinosService,
    public dialog: MatDialog,
    private loginService: LoginService,
    private movimientoService: MovimientoService,
    private userPrefService: UserPrefService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
  ) {

    loginService.getLoginStatus().subscribe(
      (status) => {
        if (status) {
          console.log('subscribe goldtables');
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
              this.dataSource = new MatTableDataSource<GoldTable>(this.inventariosActivos);
              this.dataSource.sort = this.sort;
            }
          )
          this.userPrefSub = this.userPrefService.cargarUserPref().subscribe((resultado) => {
            if (resultado) {
              this.userPref = resultado
            }
          })
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

  copiarPersonaje(goldtable: GoldTable) {
    if (this.userPref.personajes) {
      let personajeEncontrado = this.userPref.personajes.find((personaje) => {
        return personaje.reino == goldtable.reino
      })
      if (personajeEncontrado) {
        this.snackBar.open(('Se ha copiado el nombre ' + personajeEncontrado.nombre + '-' + goldtable.reinoString + ' !'), 'OK', {
          panelClass: 'snackbar-success',
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.clipboard.copy(personajeEncontrado.nombre + '-' + goldtable.reinoString);
      } else {
        this.snackBar.open(('No se ha configurado un personaje para '+ goldtable.reinoString ), 'OK', {
          panelClass: 'snackbar-error',
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    } else {
      this.snackBar.open(('No se ha configurado ningún personaje.'), 'OK', {
        panelClass: 'snackbar-error',
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
  }

  getSumaInventario() {
    let total = 0
    this.inventarios.forEach(
      (inventario) => {
        total += inventario.inventario;
      }
    )
    return total;
  }

  getSumaPendiente() {
    let total = 0
    this.inventarios.forEach(
      (inventario) => {
        total += inventario.pendiente;
      }
    )
    return total;
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

  agregarMovInventario(goldTable: GoldTable) {
    const dialogRef = this.dialog.open(AgregarMovimientoForm, {
      width: '600px',
      data: {
        tipoMov: 'inventario',
        reino: goldTable.reino
      },
    });
  }

  agregarMovPendiente(goldTable: GoldTable) {
    const dialogRef = this.dialog.open(AgregarMovimientoForm, {
      width: '600px',
      data: {
        tipoMov: 'pendiente',
        reino: goldTable.reino
      },
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AgregarMovimientoForm, {
      width: '600px'
    });
  }

  openModalPendiente(datos: GoldTable): void {
    const dialogRef = this.dialog.open(ModalPendienteComponent, {
      width: '400px',
      data: datos,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('modal cerrado');
    });
  }

  ngOnInit(): void {
  }


}
