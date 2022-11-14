import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSourceAjustes } from '../../ajustes/ajustes.component';
import { Movimiento } from '../../../models/movimiento.model';
import * as moment from 'moment';
import { Moment } from 'moment';

@Component({
  selector: 'app-modal-confirm',
  templateUrl: './modal-confirm.component.html',
  styleUrls: ['./modal-confirm.component.css']
})
export class ModalConfirmComponent implements OnInit {
  fecha: Moment;
  fechaString: string;
  modalAbierto = true;

  constructor(
    public dialogRef: MatDialogRef<ModalConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Movimiento
  ) {
    this.fecha = moment(data.fecha)
    this.fecha.locale('es')
    this.fechaString = this.fecha.format('dddd DD, MMMM')
    data.cantOro
  }

  ngOnInit(): void {

  }

  cerrarModal(): void {
    this.modalAbierto = false;
    console.log('modal cerrado'+ this.data);
    this.dialogRef.close(false);
  }

  confirmar() {
    if (this.modalAbierto == true) {
      console.log('confirmar ' + this.data);
      this.dialogRef.close(true)
    }
  }
}
