import { Injectable } from '@angular/core';

export interface LoadOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

@Injectable({ providedIn: 'root' })
export class RemoteLoaderService {
  private cache = new Map<string, Promise<void>>();
  // Dedupe adicional por tagName para evitar duplo import quando chamam com URL e com specifier ao mesmo tempo
  // (antes de o custom element estar definido).
  private tagCache = new Map<string, Promise<void>>();

  /**
   * Carrega um remote garantindo registro do custom element.
   * "urlOrSpecifier" pode ser uma URL completa (http://...) ou um specifier do import map (ex.: 'remotes/dashboard').
   * Estratégia Native Federation: usamos import() ESM em vez de injetar <script>.
   */
  loadElement(urlOrSpecifier: string, tagName: string, opts: LoadOptions = {}): Promise<void> {
    if (customElements.get(tagName)) {
      return Promise.resolve();
    }

    const inflightByTag = this.tagCache.get(tagName);
    if (inflightByTag) return inflightByTag;

    const existing = this.cache.get(urlOrSpecifier);
    if (existing) return existing;

    const { timeoutMs = 15000, retries = 0, retryDelayMs = 1000 } = opts;

    const importOnce = async () => {
      if (customElements.get(tagName)) return;
      // import() nativo. Se falhar por CORS ou 404, cairá no catch externo.
      await import(/* @vite-ignore */ urlOrSpecifier);
      if (!customElements.get(tagName)) {
        // Espera explícita caso o módulo registre de forma assíncrona.
        await customElements.whenDefined(tagName);
      }
    };

    const withRetry = async () => {
      let attempt = 0;
      for (;;) {
        const controller = new AbortController();
        const timeoutPromise = new Promise<void>((_, reject) => {
          const id = window.setTimeout(() => {
            controller.abort();
            reject(new Error(`Timeout ao importar: ${urlOrSpecifier}`));
          }, timeoutMs);
          (controller.signal as any).timeoutId = id;
        });
        try {
          await Promise.race([importOnce(), timeoutPromise]);
          const tid = (controller.signal as any).timeoutId; if (tid) window.clearTimeout(tid);
          return; // sucesso
        } catch (err) {
          const tid = (controller.signal as any).timeoutId; if (tid) window.clearTimeout(tid);
          if (attempt >= retries) throw err;
          await new Promise((r) => setTimeout(r, retryDelayMs));
          attempt++;
        }
      }
    };

    const p = withRetry();
    this.cache.set(urlOrSpecifier, p);
    this.tagCache.set(tagName, p);
    return p;
  }
}
