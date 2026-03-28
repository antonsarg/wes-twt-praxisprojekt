import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NoteService } from '../../core/services/note.service';
import { NoteCardComponent } from '../note-card/note-card.component';
import { Note } from '../../core/models/note.model';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NoteCardComponent],
  template: `
    <div class="bg-surface min-h-full">
      <div class="max-w-7xl mx-auto px-11 py-11">

        <!-- Page header -->
        <div class="mb-11">
          <h1 class="font-display font-semibold text-on-surface leading-tight" style="font-size: 3rem">
            My notes
          </h1>
          <p class="font-body text-sm text-on-surface/50 mt-2">
            @if (loading()) {
              Loading…
            } @else {
              {{ noteCount() }} {{ noteCount() === 1 ? 'note' : 'notes' }}
            }
          </p>
        </div>

        <!-- Error banner -->
        @if (error()) {
          <div role="alert" class="mb-8 px-5 py-4 rounded-xl bg-surface-container-highest font-body text-sm text-tertiary">
            {{ error() }}
          </div>
        }

        <!-- Loading skeleton — 6 placeholder cards pulsing -->
        @if (loading() && notes().length === 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.4rem]">
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
        }

        <!-- Empty state — display-lg (3.5rem) Manrope per DESIGN.md -->
        @else if (!loading() && notes().length === 0) {
          <div class="flex flex-col items-start pt-16 pb-16">
            <p
              class="font-display font-semibold text-on-surface/[0.12] leading-none mb-5 select-none"
              style="font-size: 3.5rem"
              aria-label="No notes yet"
            >
              Your canvas<br>is empty.
            </p>
            <p class="font-body text-sm text-on-surface/40">
              Tap the button below to write your first note.
            </p>
          </div>
        }

        <!-- Notes grid — shared NoteCardComponent -->
        @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.4rem]">
            @for (note of notes(); track note.id) {
              <app-note-card [note]="note" (deleted)="removeNote($event)" />
            }
          </div>
        }

      </div>

      <!-- New Note FAB -->
      <a
        routerLink="/notes/new"
        class="fixed bottom-11 right-11 flex items-center gap-2 px-6 py-3.5
               bg-gradient-to-br from-primary to-primary-container text-white
               font-body font-semibold text-[0.9375rem] border-0 rounded-3xl
               shadow-[0_0_32px_-4px_rgba(25,28,29,0.08)] cursor-pointer no-underline
               transition-opacity duration-200
               hover:opacity-[0.92]
               focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
        aria-label="Create a new note"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        New note
      </a>

    </div>
  `
})
export class DashboardComponent {
  private noteService = inject(NoteService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  notes = signal<Note[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  noteCount = computed(() => this.notes().length);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  removeNote(id: string): void {
    this.notes.update(list => list.filter(n => n.id !== id));
  }

  constructor() {
    /*
     * Drive data loading entirely from the URL query param `q`.
     * The layout's search bar navigates to /dashboard?q=... after debounce.
     * ActivatedRoute.queryParams fires immediately on subscribe (BehaviorSubject-like),
     * so this handles both the initial page load AND subsequent searches.
     */
    this.route.queryParams.pipe(
      map(params => (params['q'] ?? '').trim()),
      distinctUntilChanged(),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(q =>
        q ? this.noteService.searchNotes(q) : this.noteService.getNotes()
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: notes => { this.notes.set(notes); this.loading.set(false); },
      error: () => {
        this.error.set('Could not load notes. Please refresh.');
        this.loading.set(false);
      }
    });
  }
}
