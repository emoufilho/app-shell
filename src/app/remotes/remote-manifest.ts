export interface RemoteDefinition {
  id: string;        // ex.: 'dashboard'
  tag: string;       // ex.: 'dashboard-remote'
  url: string;       // ex.: 'http://localhost:4201/main.js'
  // Quando usar Native Federation, preferir um specifier do import map (ex.: 'remotes/dashboard').
  // Se presente, o shell usará este specifier em vez da URL bruta.
  specifier?: string;
  preload?: boolean; // se true, shell pode pré-carregar em idle
  // Opções de carregamento específicas deste remote (timeout/retry)
  loader?: {
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
  };
}

export const REMOTE_MANIFEST: RemoteDefinition[] = [
  {
    id: 'dashboard',
    tag: 'dashboard-remote',
    url: 'http://localhost:4201/main.js',
    specifier: 'remotes/dashboard',
    preload: false,
    loader: {
      timeoutMs: 15000,
      retries: 1,
      retryDelayMs: 1200,
    },
  },
  {
    id: 'content-rmt',
    tag: 'content-remote',
    url: 'http://localhost:4202/assets/remote-entry.js',
    specifier: 'remotes/content-remote',
    preload: false,
    loader: {
      timeoutMs: 15000,
      retries: 1,
      retryDelayMs: 1200,
    },
  },
  // Adicione outros remotes aqui
];
