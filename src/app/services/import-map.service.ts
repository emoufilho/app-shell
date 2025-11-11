import { Injectable } from '@angular/core';

interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
  version?: string;
}

@Injectable({ providedIn: 'root' })
export class ImportMapService {
  private loaded = false;

  async load(url: string): Promise<void> {
    if (this.loaded) return;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`[ImportMap] Falha ao buscar import map: ${url} -> ${res.status}`);
    }
    const json = (await res.json()) as ImportMap;

    const script = document.createElement('script');
    script.type = 'importmap';
    script.textContent = JSON.stringify({
      imports: json.imports ?? {},
      scopes: json.scopes ?? {},
    });
    document.head.appendChild(script);
    this.loaded = true;
    // Optional: console.debug version
    if (json.version) {
      // eslint-disable-next-line no-console
      console.debug('[ImportMap] version', json.version);
    }
  }
}
