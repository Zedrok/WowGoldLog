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
  cargando = false;

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
    public dialog: MatDialog,
  ) {
    this.loginService.getLoginStatus().subscribe((status) => {
      if (status) {
        console.log('subscribe goldtable');
        this.goldTableSub = this.goldTableService
          .cargarGoldTables()
          .subscribe((resultado) => {
            if (resultado != null) {
              this.goldTableService.cargarNombreReinos(resultado);
              this.inventarios = resultado;
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
    this.cargando = true;
    let reinosGuardados: string[] = [];
    (this.form.get('checkReinos') as FormArray).controls.forEach((control) => {
      reinosGuardados.push(control.value);
    });
    console.log(this.form.get('checkReinos') as FormArray);
    this.cargando = false;
    // await this.reinosService.guardarReinosUsuario(reinosGuardados, this.snackBar).finally(
    //   () => {
    //     this.goldTableService.guardarTablas(this.inventarios);
    //     this.cargando = false;
    //   }
    // )
  }


  openModalPersonaje(datos: DataSourceAjustes) {
    const dialogRef = this.dialog.open(ModalPersonajeComponent, {
      width: '400px',
      data: datos
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('modal cerrado');
    });
  }

}
