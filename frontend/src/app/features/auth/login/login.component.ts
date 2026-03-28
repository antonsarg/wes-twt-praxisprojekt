import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-11">
      <div class="w-full max-w-md">

        <!-- Brand -->
        <div class="mb-10">
          <span class="font-display text-xl font-bold text-primary tracking-tight">
            Smart Notes
          </span>
        </div>

        <!-- Card -->
        <div class="bg-surface-container-lowest rounded-2xl p-10 ambient-shadow">

          <h1 class="font-display text-4xl font-semibold text-on-surface leading-tight mb-2">
            Welcome back.
          </h1>
          <p class="font-body text-sm text-on-surface/60 mb-9">
            Sign in to continue your notes.
          </p>

          @if (error()) {
            <div
              role="alert"
              class="mb-6 px-4 py-3 rounded-xl bg-surface-container-highest font-body text-sm text-tertiary"
            >
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Email -->
            <div class="mb-8">
              <label
                for="login-email"
                class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-3"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="auth-input"
                placeholder="you@example.com"
                [attr.aria-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="font-body text-xs text-tertiary mt-1.5" role="alert">
                  Please enter a valid email address.
                </p>
              }
            </div>

            <!-- Password -->
            <div class="mb-10">
              <label
                for="login-password"
                class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-3"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                class="auth-input"
                placeholder="••••••••"
                [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
              />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="font-body text-xs text-tertiary mt-1.5" role="alert">
                  Password is required.
                </p>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="btn-primary w-full py-3.5 px-6 rounded-xl text-base"
            >
              {{ loading() ? 'Signing in…' : 'Sign in' }}
            </button>

          </form>
        </div>

        <!-- Register link -->
        <p class="text-center mt-6 font-body text-sm text-on-surface/60">
          No account yet?
          <a
            routerLink="/register"
            class="font-semibold text-primary ml-1 focus-visible:outline-primary"
          >
            Create one
          </a>
        </p>

      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error.set(err?.error?.message ?? 'Invalid email or password. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
