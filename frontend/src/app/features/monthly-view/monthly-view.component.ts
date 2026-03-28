import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NoteService } from '../../core/services/note.service';
import { AiService } from '../../core/services/ai.service';
import { NoteCardComponent } from '../note-card/note-card.component';
import { Note, MonthGroup } from '../../core/models/note.model';

@Component({
  selector: 'app-monthly-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NoteCardComponent],
  template: `
    <!--
      Two-column layout:
      LEFT  — sidebar (surface_container_low) per DESIGN.md "Secondary Context (Sidebars/Nav)"
      RIGHT — main content (surface) as the "Base Layer"
      Independent overflow-y-auto on each column for separate scrolling.
    -->
    <div class="flex h-full overflow-hidden">

      <!-- ── LEFT SIDEBAR ──────────────────────────────────────────────── -->
      <aside
        class="w-64 bg-surface-container-low flex flex-col overflow-y-auto shrink-0"
        aria-label="Monthly archive navigation"
      >
        <div class="px-6 pt-8 pb-5 shrink-0">
          <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50">
            Archive
          </span>
        </div>

        <nav class="px-3 pb-8 flex-1" aria-label="Select a month">

          @if (loadingMonths()) {
            <!-- Skeleton month items -->
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <div class="animate-pulse px-4 py-3 mb-1 rounded-xl">
                <div class="h-4 bg-surface-container-highest rounded-lg w-28 mb-2"></div>
                <div class="h-3 bg-surface-container-highest rounded w-12"></div>
              </div>
            }
          } @else if (months().length === 0) {
            <p class="px-4 font-body text-xs text-on-surface/40 leading-relaxed">
              No archived months yet.<br>Start writing some notes!
            </p>
          } @else {
            @for (month of months(); track month.month) {
              <!--
                Active state: surface_container_highest bg + primary text — DESIGN.md:
                "use surface_container_highest for inactive states or subtle callouts"
                Month nav item uses CSS class for hover/active rather than dynamic Tailwind
                strings (avoids JIT purging of dynamic classes).
              -->
              <button
                type="button"
                class="month-nav-item w-full text-left px-4 py-3 rounded-xl mb-1"
                [class.active-month]="isSelected(month)"
                (click)="selectMonth(month)"
                [attr.aria-current]="isSelected(month) ? 'true' : null"
                [attr.aria-label]="monthName(month.month) + ' ' + getYear(month.month) + ' — ' + month.count + ' notes'"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="font-display font-semibold text-sm transition-colors"
                    [class.text-primary]="isSelected(month)"
                    [class.text-on-surface]="!isSelected(month)"
                  >
                    {{ monthName(month.month) }}
                  </span>
                  <!-- Note count badge — rounded-full per DESIGN.md -->
                  <span
                    class="font-body font-medium px-2 py-0.5 rounded-full shrink-0
                           bg-surface-container-lowest text-on-surface/45"
                    style="font-size: 0.6875rem"
                  >
                    {{ month.count }}
                  </span>
                </div>
                <span class="font-body text-xs text-on-surface/40">{{ getYear(month.month) }}</span>
              </button>
            }
          }

        </nav>
      </aside>

      <!-- ── RIGHT MAIN CONTENT ────────────────────────────────────────── -->
      <main
        class="flex-1 bg-surface overflow-y-auto"
        id="monthly-main"
        tabindex="-1"
      >

        @if (!selectedMonth() && !loadingMonths()) {
          <!-- Empty archive state -->
          <div class="flex items-center justify-center h-full">
            <p
              class="font-display font-semibold text-on-surface/15 leading-tight select-none text-center"
              style="font-size: 2.5rem"
            >
              Your archive<br>is empty.
            </p>
          </div>
        }

        @if (selectedMonth()) {
          <div class="px-11 py-11 max-w-4xl">

            <!-- Month title ──────────────────────────────────────────── -->
            <div class="mb-11">
              <h1
                class="font-display font-semibold text-on-surface leading-tight"
                style="font-size: 3rem"
              >
                {{ monthYearFull(selectedMonth()!.month) }}
              </h1>
              <p class="font-body text-sm text-on-surface/50 mt-2">
                {{ selectedMonth()!.count }}
                {{ selectedMonth()!.count === 1 ? 'note' : 'notes' }}
              </p>
            </div>

            <!-- AI Monthly Digest ────────────────────────────────────── -->
            <section class="mb-11" aria-label="AI Monthly Digest">

              <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-4">
                Monthly Digest
              </span>

              <!--
                Summary card — surface_container_low creates contrast against
                the surface bg without any border (DESIGN.md "No-Line Rule").
              -->
              <div
                class="bg-surface-container-low rounded-xl p-7 mb-4 min-h-[5.5rem] flex items-start"
              >
                @if (loadingSummary()) {
                  <div class="animate-pulse space-y-3 w-full" aria-busy="true" aria-label="Generating summary">
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-full"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-11/12"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-5/6"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-4/6"></div>
                  </div>
                } @else if (summary()) {
                  <!--
                    "Don't center-align long-form text" — DESIGN.md.
                    Left-aligned, Inter body-lg, on_surface at 80% opacity.
                  -->
                  <p class="font-body text-sm text-on-surface/80 leading-relaxed text-left">
                    {{ summary() }}
                  </p>
                } @else {
                  <p class="font-body text-sm text-on-surface/35 italic self-center">
                    Generate an AI digest of your writing this month.
                  </p>
                }
              </div>

              <button
                type="button"
                (click)="generateSummary()"
                [disabled]="loadingSummary()"
                class="ai-btn"
                aria-label="Generate AI monthly summary"
              >
                @if (loadingSummary()) {
                  <span class="ai-spinner" aria-hidden="true"></span>
                  AI is thinking…
                } @else {
                  <span aria-hidden="true">✨</span>
                  {{ summary() ? 'Regenerate Summary' : 'Generate Summary' }}
                }
              </button>
            </section>

            <!-- Notes grid ───────────────────────────────────────────── -->
            <section aria-label="Notes for {{ monthYearFull(selectedMonth()!.month) }}">

              <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-6">
                Notes
              </span>

              @if (loadingNotes() && monthNotes().length === 0) {
                <!-- Skeleton grid (2-col since sidebar takes space) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-[1.4rem]">
                  @for (n of skeletons; track n) {
                    <div class="bg-surface-container-lowest rounded-xl p-7 animate-pulse">
                      <div class="h-5 bg-surface-container-highest rounded-lg mb-2 w-3/4"></div>
                      <div class="h-3 bg-surface-container-highest rounded mb-5 w-1/3"></div>
                      <div class="space-y-2">
                        <div class="h-3 bg-surface-container-highest rounded w-full"></div>
                        <div class="h-3 bg-surface-container-highest rounded w-5/6"></div>
                        <div class="h-3 bg-surface-container-highest rounded w-4/6"></div>
                      </div>
                    </div>
                  }
                </div>
              } @else if (!loadingNotes() && monthNotes().length === 0) {
                <p class="font-body text-sm text-on-surface/40">
                  No notes found for this month.
                </p>
              } @else {
                <!--
                  2-column grid — narrower than dashboard's 3-col because
                  the sidebar already occupies ~16rem of horizontal space.
                  Reuses shared NoteCardComponent — no duplicate card HTML.
                -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-[1.4rem]">
                  @for (note of monthNotes(); track note.id) {
                    <app-note-card [note]="note" />
                  }
                </div>
              }

            </section>
          </div>
        }

      </main>
    </div>

    <!--
      Circular FAB — pencil icon.
      position: fixed is relative to the viewport, not the scroll container.
      Ambient shadow per DESIGN.md.
    -->
    <a
      routerLink="/notes/new"
      class="fab-circle"
      aria-label="Create a new note"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
    </a>
  `
})
export class MonthlyViewComponent {
  private noteService = inject(NoteService);
  private aiService = inject(AiService);
  private destroyRef = inject(DestroyRef);

  // ── State signals ────────────────────────────────────────────────────────
  months = signal<MonthGroup[]>([]);
  selectedMonth = signal<MonthGroup | null>(null);
  monthNotes = signal<Note[]>([]);
  summary = signal<string | null>(null);

  loadingMonths = signal(true);
  loadingNotes = signal(false);
  loadingSummary = signal(false);

  readonly skeletons = [1, 2, 3, 4];

  // ── Init ─────────────────────────────────────────────────────────────────
  constructor() {
    this.noteService.getMonths().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: months => {
        this.months.set(months);
        this.loadingMonths.set(false);
        // Auto-select the most recent month (API returns chronologically descending)
        if (months.length > 0) {
          this.selectMonth(months[0]);
        }
      },
      error: () => this.loadingMonths.set(false)
    });
  }

  // ── Month selection ───────────────────────────────────────────────────────
  selectMonth(month: MonthGroup): void {
    if (this.selectedMonth()?.month === month.month) return;
    this.selectedMonth.set(month);
    this.summary.set(null);      // clear previous summary when switching months
    this.loadMonthNotes(month.month);
  }

  private loadMonthNotes(yearMonth: string): void {
    const { from, to } = this.getDateRange(yearMonth);
    this.loadingNotes.set(true);
    this.monthNotes.set([]);

    this.noteService.getNotesByDateRange(from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: notes => { this.monthNotes.set(notes); this.loadingNotes.set(false); },
        error: () => this.loadingNotes.set(false)
      });
  }

  // ── AI Summary ────────────────────────────────────────────────────────────
  generateSummary(): void {
    const month = this.selectedMonth();
    if (!month || this.loadingSummary()) return;

    this.loadingSummary.set(true);
    this.aiService.getMonthlySummary(month.month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.summary.set(res.summary); this.loadingSummary.set(false); },
        error: () => this.loadingSummary.set(false)
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isSelected(month: MonthGroup): boolean {
    return this.selectedMonth()?.month === month.month;
  }

  /** "September" */
  monthName(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  }

  /** "September 2024" */
  monthYearFull(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  /** "2024" */
  getYear(yearMonth: string): string {
    return yearMonth.split('-')[0];
  }

  /** Computes first and last day of a YYYY-MM month string. */
  private getDateRange(yearMonth: string): { from: string; to: string } {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      from: `${yearMonth}-01`,
      to: `${yearMonth}-${lastDay.toString().padStart(2, '0')}`
    };
  }
}
