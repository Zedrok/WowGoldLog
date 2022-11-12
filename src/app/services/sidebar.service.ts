import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable()
export class SidebarService {
  showSidebar: BehaviorSubject<boolean>;

  constructor() {
    this.showSidebar = new BehaviorSubject<boolean>(false);
  }

  getSidebarObservable(): Observable<boolean> {
    return this.showSidebar.asObservable();
  }

  getSidebarStatus() {
    return this.showSidebar.value;
  }

  toggleSidebar() {
    this.showSidebar.next(!this.showSidebar.value);
  }

  toggleSidebarConValor(nuevoValor: boolean) {
    this.showSidebar.next(nuevoValor);
  }
}
