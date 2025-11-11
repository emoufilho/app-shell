import { Injectable } from '@angular/core';
import { REMOTE_MANIFEST, RemoteDefinition } from '../remotes/remote-manifest';
import { RemoteLoaderService } from './remote-loader.service';

@Injectable({ providedIn: 'root' })
export class RemoteRegistryService {
  private byId = new Map<string, RemoteDefinition>(
    REMOTE_MANIFEST.map(def => [def.id, def])
  );

  get(id: string): RemoteDefinition {
    const def = this.byId.get(id);
    if (!def) {
      // Loga IDs disponíveis para facilitar debug quando há typo.
      // Evita múltiplos erros encadeados em produção.
      // Poderíamos opcionalmente retornar um stub.
      // eslint-disable-next-line no-console
      console.error('[RemoteRegistry] IDs disponíveis:', [...this.byId.keys()].join(', '));
      throw new Error(`Remote não encontrado no manifest: ${id}`);
    }
    return def;
  }

  list(): RemoteDefinition[] {
    return [...this.byId.values()];
  }

  async preloadCritical(loader: RemoteLoaderService): Promise<void> {
    const critical = this.list().filter(d => d.preload);
    await Promise.all(
      critical.map(d => loader.loadElement(d.specifier || d.url, d.tag, d.loader))
    );
  }
}
