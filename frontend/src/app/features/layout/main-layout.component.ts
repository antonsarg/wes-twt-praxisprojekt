import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!--
      Root layout: fixed left sidebar + flex-1 right content area.
      h-screen + overflow-hidden on the outer container gives both columns
      independent scroll behaviour.
    -->
    <div class="flex h-screen overflow-hidden">

      <!-- ── LEFT SIDEBAR ──────────────────────────────────────────────── -->
      <!--
        Background: surface_container_lowest (white) per user spec.
        Border: ghost border (outline_variant ≈15% opacity) per DESIGN.md fallback.
      -->
      <aside
        class="w-64 h-screen flex flex-col shrink-0 bg-surface-container-lowest sidebar-right-border"
        aria-label="Application sidebar"
      >

        <!-- Logo + subtitle -->
        <div class="px-6 pt-8 pb-7 shrink-0">
          <a
            routerLink="/dashboard"
            class="block focus-visible:outline-primary rounded-lg"
            aria-label="Smart Notes — go to dashboard"
          >
            <span class="font-display text-lg font-bold text-primary tracking-tight">
              Smart Notes
            </span>
            <p class="font-body text-xs text-on-surface/35 mt-0.5 tracking-wide">
              Anton Sarg • WES.bbM.24
            </p>
          </a>
        </div>

        <!-- Navigation links -->
        <nav class="flex-1 px-3" aria-label="Main navigation">

          <!--
            Active state: routerLinkActive adds .nav-link-active class.
            nav-link CSS reserves 3px left-border space at all times (no layout shift).
            Active state fills border-left with primary colour + bolder text + bg.
          -->
          <a
            routerLink="/dashboard"
            routerLinkActive="nav-link-active"
            [routerLinkActiveOptions]="{ exact: false }"
            class="nav-link"
            aria-label="Dashboard"
          >
            <!-- Calendar icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard-icon lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard
          </a>

          <a
            routerLink="/monthly"
            routerLinkActive="nav-link-active"
            class="nav-link"
            aria-label="Archive"
          >
            <!-- Calendar icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            Monthly Overview
          </a>

        </nav>

        <!-- Bottom: sign-out action -->
        <div class="px-3 pb-6 shrink-0">
          <button
            type="button"
            (click)="logout()"
            class="nav-link w-full"
            aria-label="Sign out"
          >
            <!-- Log-out / exit icon -->
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>

      </aside>

      <!-- ── RIGHT CONTENT AREA ────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!--
          Minimalist top header — search bar only.
          Sits at the very top of the content area, always visible.
          Background matches sidebar (white) with a subtle bottom separator.
        -->
        <header
          class="h-14 px-8 flex items-center shrink-0
                 bg-surface-container-lowest search-header-border"
          role="search"
          aria-label="Search notes"
        >
          <div class="relative w-full max-w-sm">
            <!-- Search icon -->
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style="color: rgba(25, 28, 29, 0.35)"
              aria-hidden="true"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="search"
              class="search-input"
              style="padding-left: 2.25rem"
              placeholder="Search notes…"
              [value]="searchQuery()"
              (input)="onSearch($any($event.target).value)"
              aria-label="Search all notes"
            />
          </div>
        </header>

        <!-- Router outlet — flex-1 so it fills remaining height; overflow-auto so pages scroll -->
        <main class="flex-1 overflow-auto" id="main-content" tabindex="-1">
          <router-outlet />
        </main>

      </div>
    </div>
  `
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  searchQuery = signal('');
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce keystrokes, then navigate to /dashboard?q=...
    // The DashboardComponent reads the query param to execute the search.
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => {
      this.router.navigate(['/dashboard'], {
        queryParams: q.trim() ? { q } : {},
        queryParamsHandling: 'replace'
      });
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  logout(): void {
    this.authService.logout();
  }
}
