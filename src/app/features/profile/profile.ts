import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, SessionInfo } from '../../core/services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  name = '';
  email = '';
  currentPassword = '';
  newPassword = '';
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly sessions = signal<SessionInfo[]>([]);

  constructor(readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe((profile) => {
      this.name = profile.name;
      this.email = profile.email;
    });
    this.loadSessions();
  }

  loadSessions(): void {
    this.authService.getSessions().subscribe((sessions) => this.sessions.set(sessions));
  }

  revokeSession(id: string): void {
    this.authService.revokeSession(id).subscribe(() => this.loadSessions());
  }

  saveProfile(): void {
    this.clearFeedback();
    this.authService.updateProfile(this.email, this.name).subscribe({
      next: () => this.message.set('Profiel opgeslagen.'),
      error: (err) => this.error.set(err.error ?? 'Profiel opslaan mislukt.'),
    });
  }

  changePassword(): void {
    this.clearFeedback();
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.message.set('Wachtwoord gewijzigd.');
      },
      error: (err) => this.error.set(err.error ?? 'Wachtwoord wijzigen mislukt.'),
    });
  }

  uploadAvatar(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.clearFeedback();
    this.authService.updateAvatar(file).subscribe({
      next: () => this.message.set('Profielfoto bijgewerkt.'),
      error: (err) => this.error.set(err.error ?? 'Profielfoto uploaden mislukt.'),
    });
  }

  private clearFeedback(): void {
    this.error.set(null);
    this.message.set(null);
  }
}
