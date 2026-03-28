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
        <div class="bg-surface-container-lowest rounded-2xl p-10 shadow-[0_0_32px_-4px_rgba(25,28,29,0.08)]">

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
                placeholder="you@example.com"
                class="w-full bg-transparent border-0 border-b-2 border-outline-variant/30
                       py-2 font-body text-base text-on-surface
                       transition-[border-color,border-width] duration-200 outline-none
                       placeholder:text-on-surface/30
                       focus:[border-bottom-width:3px] focus:border-primary"
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
                placeholder="••••••••"
                class="w-full bg-transparent border-0 border-b-2 border-outline-variant/30
                       py-2 font-body text-base text-on-surface
                       transition-[border-color,border-width] duration-200 outline-none
                       placeholder:text-on-surface/30
                       focus:[border-bottom-width:3px] focus:border-primary"
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
              class="w-full py-3.5 px-6 rounded-xl text-base
                     bg-gradient-to-br from-primary to-primary-container text-white
                     font-body font-semibold border-0 cursor-pointer
                     transition-opacity duration-200
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
