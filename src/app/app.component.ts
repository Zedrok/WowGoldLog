import { Component, ViewChild } from '@angular/core';
import { SidebarService } from './services/sidebar.service';
import { MatSidenav } from '@angular/material/sidenav';
import { LoginService } from './services/login.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  opened = true;
  loginState: boolean;
  title = 'WowGoldLog';

  @ViewChild("sidebar") sidebar!: MatSidenav;

  showSidebar: boolean = false;

  constructor(
    private sidebarService: SidebarService,
    private loginService: LoginService,
  ) {
    this.loginState = false;
    this.loginService.getLoginStatus().subscribe(
      (bool) => {
        this.loginState = bool;
      }
    )
  }

  ngOnInit(): void {
    this.sidebarService.getSidebarObservable().subscribe(
      (status) => {
        this.showSidebar = status;
      }
    )
  }

  toggleSidebar(valor: boolean) {
    this.sidebarService.toggleSidebarConValor(valor);
  }

}
