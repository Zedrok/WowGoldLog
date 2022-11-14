import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Reino } from 'src/app/models/reino.model';
import { ReinosService } from 'src/app/services/reinos.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoldTableService } from '../../services/goldtable.service';
import { LoginService } from '../../services/login.service';
import { Subscription } from 'rxjs';
import { GoldTable } from '../../models/goldtable.model';
import { Movimiento } from 'src/app/models/movimiento.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UserPref } from '../../models/userpref.model';
import { UserPrefService } from '../../services/userpref.service';
import { Personaje } from '../../models/personaje.model';
import { MatDialog } from '@angular/material/dialog';
import { ModalPersonajeComponent } from './modal-personaje/modal-personaje.component';

export interface DataSourceAjustes {
  reino?: Reino;
  personaje?: Personaje;
}

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css'],
})
export class AjustesComponent implements OnInit {
  reinos: Reino[] = []; // Todos los reinos
  arrayReinos: string[] = JSON.parse(localStorage.getItem('userData')!).reinos
    ? JSON.parse(localStorage.getItem('userData')!).reinos
    : [];
  form: FormGroup;
  goldTableSub!: Subscription;
  inventarios: GoldTable[] = [];
  inventariosActivos: GoldTable[] = [];
  cargando = false;
  openModal = false;

  datosAjustes: DataSourceAjustes[] = [];

  displayedColumns = ['check', 'reinoString', 'personaje', 'editar'];
  dataSource = new MatTableDataSource<DataSourceAjustes>([]);
  userPref!: UserPref;
  userPrefSub!: Subscription;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private reinosService: ReinosService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private goldTableService: GoldTableService,
    private loginService: LoginService,
    private userPrefService: UserPrefService,
    public dialog: MatDialog
  ) {
    this.loginService.getLoginStatus().subscribe((status) => {
      if (status) {
        console.log('subscribe goldtable');
        this.goldTableSub = this.goldTableService
          .cargarGoldTables()
          .subscribe((resultado) => {
            if (resultado != null) {
              this.inventarios = resultado;
              this.agregarTablasFaltantes(this.inventarios);
              this.goldTableService.cargarNombreReinos(this.inventarios);
              this.inventariosActivos = this.filtrarTablasUsuario(this.inventarios);
            } else {
              this.agregarTablasFaltantes(this.inventarios);
              this.goldTableService.cargarNombreReinos(this.inventarios);
              this.inventariosActivos = this.filtrarTablasUsuario(this.inventarios);
            }
          });

        this.reinosService.cargarReinos().subscribe((reinosCargados) => {
          this.reinos = reinosCargados;
          this.reinos.forEach((reino) => {
            if (
              this.datosAjustes.some((resultado) => {
                return resultado.reino === reino;
              }) == false
            ) {
              this.datosAjustes.push({
                reino: reino,
              });
              this.dataSource = new MatTableDataSource<DataSourceAjustes>(
                this.datosAjustes
              );
              this.dataSource.sort = this.sort;
            }
          });
        });

        console.log('subscribe userPref');
        this.userPrefSub = this.userPrefService
          .cargarUserPref()
          .subscribe((resultado) => {
            if (resultado) {
              console.log(resultado);
              this.userPref = resultado;
              if (this.userPref.personajes && this.datosAjustes.length > 0) {
                this.userPref.personajes.forEach((personaje) => {
                  let datocambiado = this.datosAjustes.find((datos) => {
                    return datos.reino!.id === personaje.reino;
                  });
                  if (datocambiado) {
                    datocambiado.personaje = personaje;
                  }
                });
              }
            }
          });

        console.log(this.reinos);
      } else {
        this.goldTableSub.unsubscribe();
        console.log('unsubscribe goldtable');
        this.userPrefSub.unsubscribe();
        console.log('unsubscribe userPref');
      }
    });

    this.form = this.initModelForm();
    this.crearCheckArray();
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

  ngOnInit(): void {}

  initModelForm(): FormGroup {
    let nuevoForm = this.formBuilder.group({
      otherControls: [''],
      checkReinos: new FormArray([]),
    });
    return nuevoForm;
  }

  onCheckChange(event: any) {
    const formArray: FormArray = this.form.get('checkReinos') as FormArray;

    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(event.target.value));
    } else {
      /* unselected */
      // find the unselected element
      let i: number = 0;

      formArray.controls.forEach((ctrl) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }

        i++;
      });
    }
  }

  // Revisa si el reino se encuentra en el array del usuario para marcarlo [checked]= true/false
  checkReino(reinoBuscado: string) {
    let boolEncontrado = this.arrayReinos.some(
      (reino) => reino === reinoBuscado
    );
    return boolEncontrado;
  }

  // Se ejecuta al inicio, agrega a checkReinos todos los reinos de la base de datos
  crearCheckArray() {
    const formArray: FormArray = this.form.get('checkReinos') as FormArray;
    this.arrayReinos.forEach((reino) => {
      formArray.push(new FormControl(reino));
    });
  }

  async guardarReinos() {
    if (this.openModal == false) {
      this.cargando = true;
      let reinosGuardados: string[] = [];
      (this.form.get('checkReinos') as FormArray).controls.forEach(
        (control) => {
          reinosGuardados.push(control.value);
        }
      );
      console.log(this.form.get('checkReinos') as FormArray);
      await this.reinosService
        .guardarReinosUsuario(reinosGuardados, this.snackBar)
        .finally(() => {
          this.goldTableService.guardarTablas(this.inventarios);
          this.cargando = false;
        });
    }
  }

  openModalPersonaje(datos: DataSourceAjustes) {
    this.openModal = true;
    console.log(this.openModal);
    const dialogRef = this.dialog.open(ModalPersonajeComponent, {
      width: '400px',
      data: datos,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.openModal = false;
      console.log(this.openModal);
    });
  }
}
