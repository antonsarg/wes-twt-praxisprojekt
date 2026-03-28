import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  // All authenticated routes share the MainLayoutComponent shell (navbar + router-outlet)
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'notes/new',
        loadComponent: () =>
          import('./features/note-editor/note-editor.component').then(m => m.NoteEditorComponent)
      },
      {
        path: 'notes/:id',
        loadComponent: () =>
          import('./features/note-editor/note-editor.component').then(m => m.NoteEditorComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
