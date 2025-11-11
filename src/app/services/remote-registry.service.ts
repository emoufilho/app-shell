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
