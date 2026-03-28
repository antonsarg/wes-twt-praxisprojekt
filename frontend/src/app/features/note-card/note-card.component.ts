import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Note } from '../../core/models/note.model';

/**
 * Shared Note Card component.
 * Used by DashboardComponent and MonthlyViewComponent.
 * Design: DESIGN.md §5 — "Lists & Note Cards"
 *   - surface_container_lowest fill (lifted look, no shadow)
 *   - rounded-xl = md radius (0.75rem)
 *   - hover: surface_container_low
 *   - No horizontal dividers
 *   - Tags: rounded-full (9999px) chips
 *   - headline-sm (Manrope) + label-md (Inter) for metadata
 */
@Component({
  selector: 'app-note-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <article
      [routerLink]="['/notes', note().id]"
      class="bg-surface-container-lowest rounded-xl p-7 cursor-pointer
             transition-colors duration-150 hover:bg-surface-container-low
             focus-visible:outline-2 focus-visible:outline-primary
             group flex flex-col"
      [attr.aria-label]="'Open note: ' + (note().title || 'Untitled')"
      tabindex="0"
      role="link"
    >
      <!-- Title (headline-sm / Manrope) + date (label-md / Inter) -->
      <header class="mb-3">
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

      <!-- Content preview (body-lg / Inter) -->
      <p class="font-body text-sm text-on-surface/65 leading-relaxed line-clamp-3 mb-4 flex-1">
        {{ note().content }}
      </p>

      <!-- Tags — rounded-full (9999px) per DESIGN.md -->
      @if (note().tags.length) {
        <footer class="flex flex-wrap gap-1.5 mt-auto">
          @for (tag of note().tags; track tag) {
            <span
              class="font-body text-xs font-medium px-2.5 py-[0.3rem]
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
  note = input.required<Note>();
}
