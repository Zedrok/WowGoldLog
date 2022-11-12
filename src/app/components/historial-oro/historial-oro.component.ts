import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MovimientoService } from '../../services/movimiento.service';
import { Movimiento } from 'src/app/models/movimiento.model';

@Component({
  selector: 'app-historial-oro',
  templateUrl: './historial-oro.component.html',
  styleUrls: ['./historial-oro.component.css'],
})
export class HistorialOroComponent implements OnInit, AfterViewInit{
  displayedColumns = ['fecha', 'reinoString', 'cantOro', 'cantUsd', 'tipoMov'];
  movimientos!: Movimiento[]

  dataSource = new MatTableDataSource<Movimiento>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private movimientoService: MovimientoService) {
    this.movimientoService.cargarMovimientos().subscribe(
      (resultado) => {
        this.movimientos = resultado
        this.dataSource = new MatTableDataSource<Movimiento>(this.movimientos);
        this.dataSource.sort = this.sort;
        this.paginator._intl.itemsPerPageLabel = 'Movimientos por página'
        this.dataSource.paginator = this.paginator;
      }
    )

    // this.movimientos[1].fecha.getTime()
  }

  ngAfterViewInit() {
  }

  ngOnInit(): void {

  }
}
