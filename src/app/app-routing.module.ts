import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/autenticacion/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/autenticacion/register/register.component';
import { AuthGuard } from './guard/auth.guard';
import { AjustesComponent } from './components/ajustes/ajustes.component';
import { LoginGuard } from './guard/login.guard';
import { HistorialOroComponent } from './components/historial-oro/historial-oro.component';

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard]  },
  { path: 'login/:registrado', component: LoginComponent, canActivate: [LoginGuard]  },
  { path: 'register', component: RegisterComponent, canActivate: [LoginGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'historial-oro', component: HistorialOroComponent, canActivate: [AuthGuard] },
  { path: 'ajustes', component: AjustesComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
