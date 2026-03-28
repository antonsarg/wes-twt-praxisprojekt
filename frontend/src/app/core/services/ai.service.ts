import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);

  generateTitle(content: string): Observable<{ title: string }> {
    return this.http.post<{ title: string }>('/api/ai/generate-title', { content });
  }

  generateTags(content: string): Observable<{ tags: string[] }> {
    return this.http.post<{ tags: string[] }>('/api/ai/generate-tags', { content });
  }

  getMonthlySummary(month: string): Observable<{ summary: string }> {
    return this.http.get<{ summary: string }>('/api/ai/monthly-summary', {
      params: new HttpParams().set('month', month)
    });
  }
}
