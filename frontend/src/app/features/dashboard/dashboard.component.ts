import { ChangeDetectionStrategy, Component } from '@angular/core';

// Placeholder — will be implemented in Phase 2
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center">
      <p class="font-display text-2xl font-semibold text-on-surface/40">Dashboard coming soon…</p>
    </div>
  `
})
export class DashboardComponent {}
