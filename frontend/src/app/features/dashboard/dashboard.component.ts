import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NoteService } from '../../core/services/note.service';
import { NoteCardComponent } from '../note-card/note-card.component';
import { Note } from '../../core/models/note.model';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NoteCardComponent],
  template: `
    <div class="bg-surface min-h-[calc(100vh-4rem)]">
      <div class="max-w-7xl mx-auto px-11 py-11">

        <!-- Page header -->
        <div class="mb-11">
          <h1 class="font-display font-semibold text-on-surface leading-tight" style="font-size: 3rem">
            Your notes.
          </h1>
          <p class="font-body text-sm text-on-surface/50 mt-2">
            @if (loading() && notes().length === 0) {
              Loading…
            } @else {
              {{ noteCount() }} {{ noteCount() === 1 ? 'note' : 'notes' }}
            }
          </p>

          <!-- Search bar — ghost border per DESIGN.md spec -->
          <div class="mt-7 max-w-sm">
            <input
              type="search"
              placeholder="Search notes…"
              class="search-input"
              [value]="searchQuery()"
              (input)="onSearch($any($event.target).value)"
              aria-label="Search notes"
            />
          </div>
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

        <!-- Notes grid — uses shared NoteCardComponent -->
        @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.4rem]">
            @for (note of notes(); track note.id) {
              <app-note-card [note]="note" />
            }
          </div>
        }

      </div>

      <!--
        New Note FAB — Signature Component per DESIGN.md:
        - Gradient: primary → primary_container
        - Ambient shadow (8% on_surface, 32px blur, -4px spread)
        - xl rounded (1.5rem) corners
        - Asymmetric bottom-right placement
      -->
      <a routerLink="/notes/new" class="fab" aria-label="Create a new note">
        <span aria-hidden="true" class="text-base leading-none">✦</span>
        New note
      </a>

    </div>
  `
})
export class DashboardComponent {
  private noteService = inject(NoteService);
  private destroyRef = inject(DestroyRef);

  notes = signal<Note[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  noteCount = computed(() => this.notes().length);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  private searchSubject = new Subject<string>();

  constructor() {
    // Initial load — direct, no debounce
    this.noteService.getNotes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: notes => { this.notes.set(notes); this.loading.set(false); },
      error: () => {
        this.error.set('Could not load notes. Please refresh.');
        this.loading.set(false);
      }
    });

    // Subsequent searches — debounced API calls
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(q =>
        q.trim() ? this.noteService.searchNotes(q) : this.noteService.getNotes()
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: notes => { this.notes.set(notes); this.loading.set(false); },
      error: () => {
        this.error.set('Search failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }
}
