import { Routes } from '@angular/router';
import { RemoteElementHostComponent } from './remote-element-host.component';

export const routes: Routes = [
	{
		path: 'dashboard',
		component: RemoteElementHostComponent,
			data: { remoteId: 'dashboard', props: { nome: 'Joao' } },
	},
	{
		path: 'content',
		component: RemoteElementHostComponent,
			data: { remoteId: 'content-rmt', props: { nome: 'Joao' } },
	},
	{
		path: 'header',
		component: RemoteElementHostComponent,
			data: { remoteId: 'header', props: { nome: 'Joao' } },
	},

	{ path: '**', redirectTo: '' },
];
