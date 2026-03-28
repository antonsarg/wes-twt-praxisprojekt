import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Note, CreateNoteRequest, UpdateNoteRequest, MonthGroup } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);

  // Signal-based cache — populated by getNotes(), kept in sync by mutations.
  // The NoteEditorComponent reads from this to avoid a redundant API call on load.
  private readonly _notes = signal<Note[]>([]);
  readonly notes: Signal<Note[]> = this._notes;

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>('/api/notes').pipe(
      tap(notes => this._notes.set(notes))
    );
  }

  searchNotes(q: string): Observable<Note[]> {
    return this.http.get<Note[]>('/api/notes/search', {
      params: new HttpParams().set('q', q)
    });
    // Note: search results intentionally do NOT overwrite the full-list cache
  }

  /**
   * Fetches notes within a specific date range for the Monthly View.
   * Calls GET /api/notes/search?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  getNotesByDateRange(from: string, to: string): Observable<Note[]> {
    return this.http.get<Note[]>('/api/notes/search', {
      params: new HttpParams().set('from', from).set('to', to)
    });
  }

  getMonths(): Observable<MonthGroup[]> {
    return this.http.get<MonthGroup[]>('/api/notes/months');
  }

  createNote(data: CreateNoteRequest): Observable<Note> {
    return this.http.post<Note>('/api/notes', data).pipe(
      tap(note => this._notes.update(existing => [note, ...existing]))
    );
  }

  updateNote(id: string, data: UpdateNoteRequest): Observable<Note> {
    return this.http.put<Note>(`/api/notes/${id}`, data).pipe(
      tap(updated => this._notes.update(existing => existing.map(n => n.id === id ? updated : n)))
    );
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`).pipe(
      tap(() => this._notes.update(existing => existing.filter(n => n.id !== id)))
    );
  }
}
