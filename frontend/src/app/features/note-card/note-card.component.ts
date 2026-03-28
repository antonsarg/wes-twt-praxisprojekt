import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Note } from '../../core/models/note.model';
import { NoteService } from '../../core/services/note.service';

@Component({
  selector: 'app-note-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <!--
      The article is the primary click/keyboard target for navigating to the editor.
      Action buttons (edit, delete) are layered on top via z-index and revealed on hover/focus-within.
      role="link" is intentionally omitted since the element contains interactive children (buttons).
    -->
    <article
      [routerLink]="['/notes', note().id]"
      (keydown.enter)="onCardKeydown($event)"
      class="relative bg-surface-container-lowest rounded-xl p-7 cursor-pointer
             transition-colors duration-150 hover:bg-surface-container-low
             focus-visible:outline-2 focus-visible:outline-primary
             group flex flex-col"
      [attr.aria-label]="'Open note: ' + (note().title || 'Untitled')"
      tabindex="0"
    >

      <!-- ── Action buttons (top-right, revealed on hover/focus-within) ─── -->
      <div
        class="absolute top-3.5 right-3.5 z-10 flex items-center gap-0.5
               opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
               transition-opacity duration-150"
      >
        @if (!showDeleteConfirm()) {
          <!-- Edit: navigate to the editor with the note pre-filled -->
          <a
            [routerLink]="['/notes', note().id]"
            (click)="$event.stopPropagation()"
            class="p-1.5 rounded-lg text-on-surface/35 hover:text-on-surface
                   hover:bg-surface-container-highest transition-colors no-underline
                   focus-visible:outline-2 focus-visible:outline-primary"
            [attr.aria-label]="'Edit: ' + (note().title || 'Untitled')"
          >
            <!-- Pencil icon -->
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </a>

          <!-- Delete: show inline confirmation -->
          <button
            type="button"
            (click)="confirmDelete($event)"
            class="p-1.5 rounded-lg text-on-surface/35 hover:text-tertiary
                   hover:bg-surface-container-highest bg-transparent border-0
                   cursor-pointer transition-colors
                   focus-visible:outline-2 focus-visible:outline-primary"
            [attr.aria-label]="'Delete: ' + (note().title || 'Untitled')"
          >
            <!-- Trash icon -->
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        } @else {
          <!-- Inline delete confirmation -->
          <div
            class="flex items-center gap-1.5 bg-surface-container-highest rounded-lg px-2.5 py-1.5"
            role="alertdialog"
            aria-label="Confirm deletion"
          >
            <span class="font-body text-xs text-on-surface/65">Delete?</span>
            <button
              type="button"
              (click)="doDelete($event)"
              [disabled]="deleteLoading()"
              class="font-body text-xs font-semibold text-tertiary cursor-pointer
                     bg-transparent border-0 hover:opacity-70 transition-opacity
                     disabled:opacity-40"
              aria-label="Confirm delete"
            >
              {{ deleteLoading() ? '…' : 'Yes' }}
            </button>
            <button
              type="button"
              (click)="cancelDelete($event)"
              class="font-body text-xs text-on-surface/50 cursor-pointer
                     bg-transparent border-0 hover:text-on-surface transition-colors"
              aria-label="Cancel delete"
            >
              No
            </button>
          </div>
        }
      </div>

      <!-- ── Card content ────────────────────────────────────────────────── -->

      <!-- Title + date -->
      <header class="mb-3 pr-14">
        <h2 class="font-display text-lg font-semibold text-on-surface leading-snug line-clamp-2 mb-1">
          {{ note().title || 'Untitled' }}
        </h2>
        <time
          class="font-body text-xs font-medium text-on-surface/40"
          [attr.datetime]="note().created_at"
        >
          {{ note().created_at | date:'MMM d, yyyy' }}
        </time>
      </header>

      <!-- Content preview -->
      <p class="font-body text-sm text-on-surface/65 leading-relaxed line-clamp-3 mb-4 flex-1">
        {{ note().content }}
      </p>

      <!-- Tags -->
      @if (note().tags.length) {
        <footer class="flex flex-wrap gap-1.5 mt-auto">
          @for (tag of note().tags; track tag) {
            <span
              class="font-body text-xs uppercase font-medium px-2.5 py-[0.3rem]
                     rounded-full bg-surface-container-low text-on-surface/60
                     group-hover:bg-surface-container-highest transition-colors"
            >
              {{ tag }}
            </span>
          }
        </footer>
      }
    </article>
  `
})
export class NoteCardComponent {
  private router = inject(Router);
  private noteService = inject(NoteService);
  private destroyRef = inject(DestroyRef);

  note = input.required<Note>();
  deleted = output<string>();

  deleteLoading = signal(false);
  showDeleteConfirm = signal(false);

  /** Navigate on Enter key — only when the article itself is the event target (not a child button). */
  onCardKeydown(event: Event): void {
    if (event.target !== event.currentTarget) return;
    this.router.navigate(['/notes', this.note().id]);
  }

  confirmDelete(event: Event): void {
    event.stopPropagation();
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(event: Event): void {
    event.stopPropagation();
    this.showDeleteConfirm.set(false);
  }

  doDelete(event: Event): void {
    event.stopPropagation();
    if (this.deleteLoading()) return;

    this.deleteLoading.set(true);
    this.noteService.deleteNote(this.note().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.deleted.emit(this.note().id),
        error: () => {
          this.deleteLoading.set(false);
          this.showDeleteConfirm.set(false);
        }
      });
  }
}
