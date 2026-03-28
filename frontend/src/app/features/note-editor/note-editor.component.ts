import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { NoteService } from '../../core/services/note.service';
import { AiService } from '../../core/services/ai.service';
import { Note } from '../../core/models/note.model';

@Component({
  selector: 'app-note-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] bg-surface-container-lowest">

      @if (loadingNote()) {
        <div class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <p class="font-display text-2xl font-semibold text-on-surface/20 animate-pulse">
            Loading note…
          </p>
        </div>
      } @else {

        <form [formGroup]="form" (ngSubmit)="save()" novalidate>

          <div
            class="sticky top-16 z-10 flex items-center gap-4 px-11 py-4
                   bg-surface-container-lowest/80 backdrop-blur-md"
          >
            <a
              routerLink="/dashboard"
              class="font-body text-sm text-on-surface/50 hover:text-on-surface
                     transition-colors flex items-center gap-1.5 rounded focus-visible:outline-primary"
              aria-label="Back to notes"
            >
              <span aria-hidden="true">←</span>
              Notes
            </a>

            <div class="ml-auto flex items-center gap-3">

              @if (isEditMode()) {
                @if (showDeleteConfirm()) {
                  <div
                    class="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container-highest"
                    role="alertdialog"
                    aria-label="Confirm note deletion"
                  >
                    <span class="font-body text-sm text-on-surface/70">
                      Delete this note?
                    </span>
                    <button
                      type="button"
                      (click)="deleteNote()"
                      [disabled]="deleting()"
                      class="font-body text-sm font-semibold text-tertiary
                             hover:opacity-70 transition-opacity disabled:opacity-40 cursor-pointer"
                    >
                      {{ deleting() ? 'Deleting…' : 'Yes, delete' }}
                    </button>
                    <button
                      type="button"
                      (click)="showDeleteConfirm.set(false)"
                      class="font-body text-sm text-on-surface/50 hover:text-on-surface
                             transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    (click)="showDeleteConfirm.set(true)"
                    class="font-body text-sm text-on-surface/35 hover:text-tertiary
                           px-3 py-2 transition-colors cursor-pointer rounded
                           focus-visible:outline-primary"
                  >
                    Delete
                  </button>
                }
              }

              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="btn-primary px-5 py-2.5 rounded-xl text-sm"
              >
                {{ saving() ? 'Saving…' : isEditMode() ? 'Save changes' : 'Create note' }}
              </button>

            </div>
          </div>

          <div class="max-w-3xl mx-auto px-11 py-12">

            <div class="mb-10">
              <input
                id="note-title"
                type="text"
                formControlName="title"
                class="editor-title w-full"
                placeholder="Note title…"
                autocomplete="off"
                aria-label="Note title"
                [attr.aria-invalid]="form.get('title')?.invalid && form.get('title')?.touched"
              />
              @if (form.get('title')?.invalid && form.get('title')?.touched) {
                <p class="font-body text-xs text-tertiary mt-2" role="alert">
                  A title is required.
                </p>
              }

              <button
                type="button"
                (click)="generateTitle()"
                [disabled]="!hasContent() || aiTitleLoading()"
                class="ai-btn mt-4"
                aria-label="Generate title with AI"
              >
                @if (aiTitleLoading()) {
                  <span class="ai-spinner" aria-hidden="true"></span>
                  AI is thinking…
                } @else {
                  <span aria-hidden="true">✨</span>
                  Magic Title
                }
              </button>
            </div>

            <div class="mb-12">
              <textarea
                id="note-content"
                formControlName="content"
                class="editor-content w-full text-left"
                placeholder="Start writing…"
                aria-label="Note content"
                (input)="autoResize($event)"
                [attr.aria-invalid]="form.get('content')?.invalid && form.get('content')?.touched"
              ></textarea>
              @if (form.get('content')?.invalid && form.get('content')?.touched) {
                <p class="font-body text-xs text-tertiary mt-2" role="alert">
                  Content is required.
                </p>
              }
            </div>

            <div class="mb-10">
              <label class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-4">
                Tags
              </label>

              <div class="flex flex-wrap gap-2 items-center min-h-[2rem]">
                @for (tag of tags(); track tag) {
                  <span class="tag-chip">
                    {{ tag }}
                    <button
                      type="button"
                      (click)="removeTag(tag)"
                      class="tag-chip-remove"
                      [attr.aria-label]="'Remove tag ' + tag"
                    >
                      ×
                    </button>
                  </span>
                }

                <input
                  #tagInputEl
                  type="text"
                  class="tag-inline-input"
                  placeholder="{{ tags().length ? '' : 'Add tags…' }}"
                  (keydown)="onTagKeydown($event, tagInputEl)"
                  aria-label="Add tag — press Enter or comma to confirm"
                />
              </div>

              <button
                type="button"
                (click)="generateTags(tagInputEl)"
                [disabled]="!hasContent() || aiTagsLoading()"
                class="ai-btn mt-4"
                aria-label="Generate tags with AI"
              >
                @if (aiTagsLoading()) {
                  <span class="ai-spinner" aria-hidden="true"></span>
                  AI is thinking…
                } @else {
                  <span aria-hidden="true">✨</span>
                  Magic Tags
                }
              </button>
            </div>

            @if (saveError()) {
              <div
                role="alert"
                class="px-5 py-4 rounded-xl bg-surface-container-highest font-body text-sm text-tertiary"
              >
                {{ saveError() }}
              </div>
            }

          </div>
        </form>

      }
    </div>
  `
})
export class NoteEditorComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noteService = inject(NoteService);
  private aiService = inject(AiService);
  private destroyRef = inject(DestroyRef);

  // ── Form ─────────────────────────────────────────────────────────────────
  // Defined FIRST so it can be referenced by the `toSignal` computation below.
  form = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required]
  });

  // ── State signals ────────────────────────────────────────────────────────
  noteId = signal<string | null>(null);
  isEditMode = computed(() => !!this.noteId());

  tags = signal<string[]>([]);

  loadingNote = signal(false);
  saving = signal(false);
  deleting = signal(false);
  showDeleteConfirm = signal(false);

  aiTitleLoading = signal(false);
  aiTagsLoading = signal(false);

  saveError = signal<string | null>(null);

  // Bridging the RxJS valueChanges observable into an Angular Signal
  hasContent = toSignal(
    this.form.controls.content.valueChanges.pipe(
      map(val => !!val?.trim())
    ),
    { initialValue: !!this.form.controls.content.value?.trim() }
  );

  // ── Init ─────────────────────────────────────────────────────────────────
  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.noteId.set(id);
      this.loadNote(id);
    }
  }

  private loadNote(id: string): void {
    // Fast path: use the service's in-memory cache populated by the dashboard
    const cached = this.noteService.notes().find(n => n.id === id);
    if (cached) {
      this.populateForm(cached);
      return;
    }

    // Slow path: no cache yet (direct URL navigation or page reload)
    this.loadingNote.set(true);
    this.noteService.getNotes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: notes => {
        const note = notes.find(n => n.id === id);
        if (note) {
          this.populateForm(note);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.loadingNote.set(false);
      },
      error: () => this.router.navigate(['/dashboard'])
    });
  }

  private populateForm(note: Note): void {
    this.form.patchValue({ title: note.title, content: note.content });
    this.tags.set([...note.tags]);
  }

  // ── Tag management ────────────────────────────────────────────────────────
  onTagKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();

    const value = input.value.trim().replace(/,/g, '').toLowerCase();
    if (value && !this.tags().includes(value)) {
      this.tags.update(t => [...t, value]);
    }
    input.value = '';
  }

  removeTag(tag: string): void {
    this.tags.update(t => t.filter(t2 => t2 !== tag));
  }

  // ── AI features ───────────────────────────────────────────────────────────
  generateTitle(): void {
    const content = this.form.get('content')?.value?.trim();
    if (!content || this.aiTitleLoading()) return;

    this.aiTitleLoading.set(true);
    this.aiService.generateTitle(content).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.form.patchValue({ title: res.title });
        this.aiTitleLoading.set(false);
      },
      error: () => this.aiTitleLoading.set(false)
    });
  }

  generateTags(tagInput: HTMLInputElement): void {
    const content = this.form.get('content')?.value?.trim();
    if (!content || this.aiTagsLoading()) return;

    // Commit any pending text in the tag input before AI generation
    const pending = tagInput.value.trim().toLowerCase();
    if (pending && !this.tags().includes(pending)) {
      this.tags.update(t => [...t, pending]);
      tagInput.value = '';
    }

    this.aiTagsLoading.set(true);
    this.aiService.generateTags(content).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const newTags = res.tags.filter(t => !this.tags().includes(t));
        this.tags.update(existing => [...existing, ...newTags]);
        this.aiTagsLoading.set(false);
      },
      error: () => this.aiTagsLoading.set(false)
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);

    const payload = {
      title: this.form.getRawValue().title!,
      content: this.form.getRawValue().content!,
      tags: this.tags()
    };

    const request$ = this.isEditMode()
      ? this.noteService.updateNote(this.noteId()!, payload)
      : this.noteService.createNote(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.saveError.set(err?.error?.message ?? 'Failed to save note. Please try again.');
        this.saving.set(false);
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteNote(): void {
    if (!this.noteId() || this.deleting()) return;

    this.deleting.set(true);
    this.noteService.deleteNote(this.noteId()!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      }
    });
  }

  // ── Textarea auto-resize (JS fallback for field-sizing: content) ──────────
  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
