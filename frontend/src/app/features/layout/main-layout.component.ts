import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="flex flex-col min-h-screen">

      <!-- Navigation bar -->
      <!-- No bottom border: tonal shift from surface_container_low → surface creates the separation -->
      <header
        class="h-16 bg-surface-container-low flex items-center px-11 shrink-0"
        role="banner"
      >
        <!-- Logo -->
        <a
          routerLink="/dashboard"
          class="font-display font-bold text-lg text-primary tracking-tight mr-auto focus-visible:outline-primary rounded"
          aria-label="Smart Notes — go to dashboard"
        >
          Smart Notes
        </a>

        <!-- Nav actions -->
        <nav aria-label="Main navigation">
          <button
            type="button"
            (click)="logout()"
            class="font-body text-sm font-medium text-on-surface/50 hover:text-on-surface
                   px-4 py-2 rounded-lg hover:bg-surface-container-highest
                   transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </nav>
      </header>

      <!-- Page content -->
      <main class="flex-1" id="main-content" tabindex="-1">
        <router-outlet />
      </main>

    </div>
  `
})
export class MainLayoutComponent {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
