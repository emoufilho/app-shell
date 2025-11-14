# AppShell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.21.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Remotes e Import Map

- O shell carrega um Import Map em runtime via `APP_INITIALIZER` (`ImportMapService`).
- O arquivo utilizado em desenvolvimento é `public/import-map.dev.json`, servido como `/import-map.dev.json`.
- O manifest de remotes está em `src/app/remotes/remote-manifest.ts` e define:
	- `id` (identificador lógico usado no shell)
	- `tag` (custom element exposto pelo remote)
	- `specifier` (chave do import map, ex.: `remotes/dashboard`)
	- `url` (fallback direto)

Fluxo em tempo de execução:
1. O Import Map é injetado no `<head>` (type=`importmap`).
2. O componente `app-remote-host` resolve o remote via manifest e carrega pelo `specifier` mapeado.
3. O remote registra o web component (ex.: `<dashboard-remote>`), que é montado no DOM.

Padrões recomendados:
- Mantenha apenas um arquivo de import map ativo por ambiente (ex.: `public/import-map.dev.json`).
- Para produção, crie `public/import-map.prod.json` e condicione a URL carregada pelo `ImportMapService` (ou gere via script de build).
