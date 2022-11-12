import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { SidebarService } from 'src/app/services/sidebar.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  user: User;

  constructor(
    private sidebarService: SidebarService,
    private loginService: LoginService
  ) {
    this.user = JSON.parse(localStorage.getItem('userData')!) as User
  }

  ngOnInit(): void {

  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  signout() {
    this.loginService.logout();
  }
}
