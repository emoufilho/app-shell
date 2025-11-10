import { Injectable } from '@angular/core';

export interface LoadOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

@Injectable({ providedIn: 'root' })
export class RemoteLoaderService {
  private cache = new Map<string, Promise<void>>();

  loadElement(url: string, tagName: string, opts: LoadOptions = {}): Promise<void> {
    if (customElements.get(tagName)) {
      return Promise.resolve();
    }

    const existing = this.cache.get(url);
    if (existing) return existing;

    const { timeoutMs = 15000, retries = 0, retryDelayMs = 1000 } = opts;

    const loadOnce = () =>
      new Promise<void>((resolve, reject) => {
        if (customElements.get(tagName)) {
          resolve();
          return;
        }

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

        const onSuccess = () => {
          if (customElements.get(tagName)) {
            cleanup();
            resolve();
          } else {
            customElements
              .whenDefined(tagName)
              .then(() => {
                cleanup();
                resolve();
              })
              .catch((err) => {
                cleanup();
                reject(err);
              });
          }
        };

        const onError = () => {
          cleanup();
          reject(new Error(`Falha ao carregar script remoto: ${url}`));
        };

        script.onload = onSuccess;
        script.onerror = onError;

        timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout ao carregar: ${url}`));
        }, timeoutMs);

        document.head.appendChild(script);
      });

    const withRetry = async () => {
      let attempt = 0;
      for (;;) {
        try {
          return await loadOnce();
        } catch (err) {
          if (attempt >= retries) throw err;
          await new Promise((r) => setTimeout(r, retryDelayMs));
          attempt++;
        }
      }
    };

    const p = withRetry();
    this.cache.set(url, p);
    return p;
  }
}
