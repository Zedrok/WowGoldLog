import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TokenChartComponent } from './components/home/token-chart/token-chart.component';
import { GoldTableComponent } from './components/home/gold-table/gold-table.component';
import { MatsPricesComponent } from './components/home/mats-prices/mats-prices.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SidebarService } from './services/sidebar.service';
import { MatButtonModule } from '@angular/material/button';
import { AgregarMovimientoForm } from './components/home/agregar-movimiento-form/agregar-movimiento-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { GoldTableService } from './services/goldtable.service';
import { ReinosService } from './services/reinos.service';
import { ModalPendienteComponent } from './components/home/modal-pendiente/modal-pendiente.component';

import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import {
  AngularFirestoreModule,
  SETTINGS,
} from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { LoginComponent } from './components/autenticacion/login/login.component';
import { RegisterComponent } from './components/autenticacion/register/register.component';
import { LoginService } from './services/login.service';
import { AuthGuard } from './guard/auth.guard';
import { AjustesComponent } from './components/ajustes/ajustes.component';
import { LoginGuard } from './guard/login.guard';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MovimientoService } from './services/movimiento.service';
import { HistorialOroComponent } from './components/historial-oro/historial-oro.component';
import { MatTableModule } from '@angular/material/table';
import { HttpClientModule } from '@angular/common/http';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import es from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import * as moment from 'moment';
import { ModalTokenComponent } from './components/home/modal-token/modal-token.component';
import { UserPrefService } from './services/userpref.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ModalUsdComponent } from './components/home/modal-usd/modal-usd.component';
import { ModalPersonajeComponent } from './components/ajustes/modal-personaje/modal-personaje.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MomentDateModule } from '@angular/material-moment-adapter';
import { ModalConfirmComponent } from './components/historial-oro/modal-confirm/modal-confirm.component';
import { ResumenComponent } from './components/resumen/resumen.component'

registerLocaleData(es);


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    TokenChartComponent,
    GoldTableComponent,
    MatsPricesComponent,
    AgregarMovimientoForm,
    ModalPendienteComponent,
    LoginComponent,
    RegisterComponent,
    AjustesComponent,
    HistorialOroComponent,
    ModalTokenComponent,
    ModalUsdComponent,
    ModalPersonajeComponent,
    ModalConfirmComponent,
    ResumenComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgApexchartsModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firestore, 'registro-oro-wow'),
    AngularFirestoreModule,
    AngularFireAuthModule,
    MatSnackBarModule,
    MatTableModule,
    HttpClientModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    ClipboardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MomentDateModule
  ],
  providers: [
    SidebarService,
    GoldTableService,
    AuthGuard,
    LoginGuard,
    ReinosService,
    LoginService,
    MovimientoService,
    UserPrefService,
    { provide: LOCALE_ID, useValue: "es-ES" }

  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
