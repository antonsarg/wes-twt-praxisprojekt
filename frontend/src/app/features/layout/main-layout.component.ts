import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden">

      <!-- Mobile backdrop overlay -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/20 md:hidden"
          (click)="sidebarOpen.set(false)"
          aria-hidden="true"
        ></div>
      }

      <!-- ── SIDEBAR ─────────────────────────────────────────────────────── -->
      <!--
        Mobile: fixed drawer, slides in from the left.
        Desktop (md+): static, always visible in the flex row.
      -->
      <aside
        id="main-sidebar"
        class="fixed inset-y-0 left-0 z-30 w-64 flex flex-col shrink-0
               bg-surface-container-lowest border-r border-outline-variant/25
               transition-transform duration-200
               md:static md:translate-x-0 md:z-auto"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
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

          <a
            routerLink="/dashboard"
            routerLinkActive
            #dashRla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2.5 py-2.5 pl-3 pr-3.5 mb-1
                   border-r-[3px] font-body text-[0.875rem] no-underline cursor-pointer
                   transition-colors duration-150"
            [class]="dashRla.isActive
              ? 'border-r-primary bg-surface-container-low text-on-surface font-semibold'
              : 'border-r-transparent text-on-surface/55 font-medium hover:bg-surface-container-highest/50'"
            aria-label="Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard-icon lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard
          </a>

          <a
            routerLink="/monthly"
            routerLinkActive
            #archRla="routerLinkActive"
            class="flex items-center gap-2.5 py-2.5 pl-3 pr-3.5 mb-1
                   border-r-[3px] font-body text-[0.875rem] no-underline cursor-pointer
                   transition-colors duration-150"
            [class]="archRla.isActive
              ? 'border-r-primary bg-surface-container-low text-on-surface font-semibold'
              : 'border-r-transparent text-on-surface/55 font-medium hover:bg-surface-container-highest/50'"
            aria-label="Archive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-icon lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            Montly Overview
          </a>

        </nav>

        <!-- Bottom: sign-out -->
        <div class="px-3 pb-6 shrink-0">
          <button
            type="button"
            (click)="logout()"
            class="flex items-center gap-2.5 py-2.5 pl-3 pr-3.5 w-full
                   border-r-[3px] border-r-transparent font-body text-[0.875rem] font-medium
                   text-on-surface/55 cursor-pointer bg-transparent border-t-0 border-r-0 border-b-0
                   transition-colors duration-150 hover:bg-surface-container-highest/50"
            aria-label="Sign out"
          >
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

      <!-- ── RIGHT CONTENT AREA ────────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Search header -->
        <header
          class="h-20 px-4 md:px-8 flex items-center shrink-0
                 bg-surface-container-lowest border-b border-outline-variant/20"
          role="search"
          aria-label="Search notes"
        >

          <!-- Hamburger button — mobile only -->
          <button
            type="button"
            class="md:hidden mr-3 p-2 rounded-lg text-on-surface/55 bg-transparent
                   border-0 hover:bg-surface-container-highest transition-colors duration-150 cursor-pointer"
            (click)="sidebarOpen.update(v => !v)"
            [attr.aria-expanded]="sidebarOpen()"
            aria-controls="main-sidebar"
            aria-label="Toggle navigation"
          >
            @if (sidebarOpen()) {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            } @else {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            }
          </button>

          <div class="relative w-full max-w-sm">
            <span
              class="absolute left-3 top-1/2 text-primary -translate-y-1/2 pointer-events-none text-on-surface/35"
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
              class="w-full bg-zinc-100 border border-outline-variant/15 rounded-full
                     pl-9 pr-4 py-2.5 font-body text-sm text-on-surface
                     outline-none transition-[border-color] duration-200
                     placeholder:text-on-surface/35
                     focus:border-primary/35"
              placeholder="Search notes…"
              [value]="searchQuery()"
              (input)="onSearch($any($event.target).value)"
              aria-label="Search all notes"
            />
          </div>
        </header>

        <!-- Router outlet -->
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
  sidebarOpen = signal(false);
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search and navigate to /dashboard?q=...
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

    // Close the mobile sidebar automatically on any navigation
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.sidebarOpen.set(false));
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  logout(): void {
    this.authService.logout();
  }
}
