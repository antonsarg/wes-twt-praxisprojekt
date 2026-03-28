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
      LEFT  — month list sidebar (surface_container_low)
      RIGHT — main content (surface)
      Mobile: stacks vertically; desktop: side by side.
    -->
    <div class="flex flex-col md:flex-row h-full overflow-hidden">

      <!-- ── LEFT SIDEBAR ──────────────────────────────────────────────── -->
      <aside
        class="w-full md:w-64 bg-surface-container-low flex flex-col shrink-0
               overflow-y-auto max-h-64 md:max-h-none border-b border-outline-variant/20
               md:border-b-0 md:border-r md:border-outline-variant/20"
        aria-label="Monthly archive navigation"
      >
        <div class="px-6 pt-6 md:pt-8 pb-5 shrink-0">
          <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50">
            Archive
          </span>
        </div>

        <nav class="px-3 pb-6 md:pb-8 flex-1" aria-label="Select a month">

          @if (loadingMonths()) {
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
              <button
                type="button"
                class="w-full text-left px-4 py-3 rounded-xl mb-1 cursor-pointer border-0
                       transition-colors duration-150"
                [class]="isSelected(month)
                  ? 'bg-surface-container-highest'
                  : 'bg-transparent hover:bg-surface-container-highest/50'"
                (click)="selectMonth(month)"
                [attr.aria-current]="isSelected(month) ? 'true' : null"
                [attr.aria-label]="monthName(month.month) + ' ' + getYear(month.month) + ' — ' + month.count + ' notes'"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="font-display font-semibold text-sm transition-colors"
                    [class]="isSelected(month) ? 'text-primary' : 'text-on-surface'"
                  >
                    {{ monthName(month.month) }}
                  </span>
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
          <div class="flex items-center justify-center h-full min-h-64">
            <p
              class="font-display font-semibold text-on-surface/15 leading-tight select-none text-center"
              style="font-size: 2.5rem"
            >
              Your archive<br>is empty.
            </p>
          </div>
        }

        @if (selectedMonth()) {
          <div class="px-6 md:px-11 py-8 md:py-11 max-w-4xl">

            <!-- Month title -->
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

            <!-- AI Monthly Digest -->
            <section class="mb-11" aria-label="AI Monthly Digest">

              <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-4">
                Monthly Digest
              </span>

              <div class="bg-surface-container-low rounded-xl p-7 mb-4 min-h-[5.5rem] flex items-start">
                @if (loadingSummary()) {
                  <div class="animate-pulse space-y-3 w-full" aria-busy="true" aria-label="Generating summary">
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-full"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-11/12"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-5/6"></div>
                    <div class="h-3.5 bg-surface-container-highest rounded-lg w-4/6"></div>
                  </div>
                } @else if (summary()) {
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
                class="inline-flex items-center gap-1.5 px-[1.125rem] py-2 rounded-full
                       bg-gradient-to-br from-primary to-primary-container
                       text-white font-body text-[0.8125rem] font-semibold
                       border-0 cursor-pointer transition-opacity duration-200 whitespace-nowrap
                       enabled:hover:opacity-[0.88]
                       disabled:opacity-45 disabled:cursor-not-allowed
                       focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
                aria-label="Generate AI monthly summary"
              >
                @if (loadingSummary()) {
                  <span
                    class="inline-block shrink-0 w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    aria-hidden="true"
                  ></span>
                  AI is thinking…
                } @else {
                  <span aria-hidden="true">✨</span>
                  {{ summary() ? 'Regenerate Summary' : 'Generate Summary' }}
                }
              </button>
            </section>

            <!-- Notes grid -->
            <section aria-label="Notes for {{ monthYearFull(selectedMonth()!.month) }}">

              <span class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-6">
                Notes
              </span>

              @if (loadingNotes() && monthNotes().length === 0) {
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

    <!-- Circular FAB — pencil icon -->
    <a
      routerLink="/notes/new"
      class="fixed bottom-11 right-11 w-14 h-14 rounded-full
             bg-gradient-to-br from-primary to-primary-container text-white
             flex items-center justify-center no-underline border-0
             shadow-[0_0_32px_-4px_rgba(25,28,29,0.08)]
             transition-opacity duration-200
             hover:opacity-[0.88]
             focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
      aria-label="Create a new note"
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
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
    this.summary.set(null);
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
