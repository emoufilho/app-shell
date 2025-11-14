import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { RemoteElementHostComponent } from './remote-element-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RemoteElementHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppComponent {
  showAll = false;
  nome = 'Joao';
  dashboardValor?: number;

  constructor(private router: Router) {
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        const path = evt.urlAfterRedirects.split('?')[0].split('#')[0];
        this.showAll = path === '/' || path === '';
      }
    });
    // Verificação inicial para primeira carga.
    const initialPath = this.router.url.split('?')[0].split('#')[0];
    this.showAll = initialPath === '/' || initialPath === '';
  }

  changeNome() {
    this.nome = this.nome === 'Joao' ? 'Maria' : 'Joao';
  }

  atualizarDashboardValor(v: number) {
    this.dashboardValor = v;
  }
}
