import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
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
            Create account.
          </h1>
          <p class="font-body text-sm text-on-surface/60 mb-9">
            Start your focused journey today.
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
                for="reg-email"
                class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-3"
              >
                Email
              </label>
              <input
                id="reg-email"
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
            <div class="mb-8">
              <label
                for="reg-password"
                class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-3"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                class="auth-input"
                placeholder="••••••••"
                [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
              />
              @if (form.get('password')?.errors?.['minlength'] && form.get('password')?.touched) {
                <p class="font-body text-xs text-tertiary mt-1.5" role="alert">
                  Password must be at least 8 characters.
                </p>
              }
              @if (form.get('password')?.errors?.['required'] && form.get('password')?.touched) {
                <p class="font-body text-xs text-tertiary mt-1.5" role="alert">
                  Password is required.
                </p>
              }
            </div>

            <!-- Confirm password -->
            <div class="mb-10">
              <label
                for="reg-confirm"
                class="font-body text-xs font-semibold uppercase tracking-widest text-on-surface/50 block mb-3"
              >
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                class="auth-input"
                placeholder="••••••••"
                [attr.aria-invalid]="
                  (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) ||
                  (form.get('confirmPassword')?.invalid && form.get('confirmPassword')?.touched)
                "
              />
              @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="font-body text-xs text-tertiary mt-1.5" role="alert">
                  Passwords do not match.
                </p>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="btn-primary w-full py-3.5 px-6 rounded-xl text-base"
            >
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>

          </form>
        </div>

        <!-- Login link -->
        <p class="text-center mt-6 font-body text-sm text-on-surface/60">
          Already have an account?
          <a
            routerLink="/login"
            class="font-semibold text-primary ml-1 focus-visible:outline-primary"
          >
            Sign in
          </a>
        </p>

      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loading()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.register(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
