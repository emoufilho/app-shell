import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { RemoteRegistryService } from './services/remote-registry.service';
import { RemoteLoaderService } from './services/remote-loader.service';

@Component({
  selector: 'app-remote-host',
  standalone: true,
  imports: [NgIf],
  template: `
    <div #container class="remote-host">
      <ng-container *ngIf="!ready">Carregando…</ng-container>
    </div>
  `,
  styles: [`.remote-host{display:block;min-height:80px;}`]
})
export class RemoteElementHostComponent implements OnInit, OnDestroy {
  @Input() remoteId!: string;
  @Input() props?: Record<string, unknown>;
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;

  ready = false;

  constructor(
    private registry: RemoteRegistryService,
    private loader: RemoteLoaderService,
  ) {}

  async ngOnInit() {
    try {
      const def = this.registry.get(this.remoteId);
      
      if (!customElements.get(def.tag)) {
        const primary = def.specifier || def.url;
        try {
          await this.loader.loadElement(primary, def.tag, def.loader);
        } catch (e) {
          // Fallback: se falhar ao importar pelo specifier, tenta URL direta.
          if (def.specifier && def.url && primary !== def.url) {
            console.warn('[RemoteHost] fallback para URL direta do remote', def.id, def.url);
            await this.loader.loadElement(def.url, def.tag, {
              timeoutMs: def.loader?.timeoutMs ?? 20000,
              retries: (def.loader?.retries ?? 0) + 1,
              retryDelayMs: def.loader?.retryDelayMs ?? 1200,
            });
          } else {
            throw e;
          }
        }
      }

      this.mount(def.tag);
    } catch (err) {
      console.error('[RemoteHost] Falha ao preparar remote', this.remoteId, err);
      this.container.nativeElement.innerText = 'Falha ao carregar.';
    }
  }

  ngOnDestroy(): void {
    const host = this.container?.nativeElement;
    if (host) host.innerHTML = '';
  }

  private mount(tag: string) {
    this.ready = true;
    const host = this.container.nativeElement;
    host.innerHTML = '';

    const el = document.createElement(tag) as any;
    if (this.props) {
      for (const [k, v] of Object.entries(this.props)) {
        if (v !== null && typeof v === 'object') {
          el[k] = v;
        } else {
          el.setAttribute(k, String(v));
        }
      }
    }

    host.appendChild(el);
  }
}
