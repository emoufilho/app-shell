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
    if (customElements.get(tagName)) return Promise.resolve();

    const inflightByTag = this.tagCache.get(tagName);
    if (inflightByTag) return inflightByTag;

    const existing = this.cache.get(urlOrSpecifier);
    if (existing) return existing;

    const { timeoutMs = 15000, retries = 0, retryDelayMs = 1000 } = opts;

    const importOnce = async () => {
      if (customElements.get(tagName)) return;
      try {
        await import(/* @vite-ignore */ urlOrSpecifier);
      } catch (e: any) {
        // Em alguns casos (Angular <=12 + import map), fallback para injeção de <script type="module"> pode ser mais compatível.
        // Detecta erro de sintaxe de módulo ou falha de resolução.
        if (/Failed|Cannot|SyntaxError/.test(String(e))) {
          await this.injectScriptFallback(urlOrSpecifier, tagName, timeoutMs);
        } else {
          throw e;
        }
      }
      if (!customElements.get(tagName)) {
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
          return;
        } catch (err) {
          const tid = (controller.signal as any).timeoutId; if (tid) window.clearTimeout(tid);
          if (attempt >= retries) throw err;
          await new Promise(r => setTimeout(r, retryDelayMs));
          attempt++;
        }
      }
    };

    const p = withRetry();
    this.cache.set(urlOrSpecifier, p);
    this.tagCache.set(tagName, p);
    return p;
  }

  private injectScriptFallback(url: string, tagName: string, timeoutMs: number): Promise<void> {
    if (customElements.get(tagName)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.async = true;
      let timeoutId: number | undefined;
      const cleanup = () => {
        script.onload = null;
        script.onerror = null;
        if (timeoutId) window.clearTimeout(timeoutId);
      };
      const done = () => {
        if (customElements.get(tagName)) {
          cleanup();
          resolve();
        } else {
          customElements.whenDefined(tagName).then(() => {
            cleanup();
            resolve();
          }).catch(err => {
            cleanup();
            reject(err);
          });
        }
      };
      script.onload = done;
      script.onerror = () => {
        cleanup();
        reject(new Error(`Falha ao carregar script remoto: ${url}`));
      };
      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout ao carregar: ${url}`));
      }, timeoutMs);
      document.head.appendChild(script);
    });
  }
}
