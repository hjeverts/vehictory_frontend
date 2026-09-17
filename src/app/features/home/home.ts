import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('Vehictory — Voertuigen, brandstof en onderhoud bijhouden');
    this.meta.updateTag({
      name: 'description',
      content:
        'Vehictory houdt brandstofverbruik, onderhoud en kosten van je voertuigen bij en toont overzichtelijke statistieken. Gratis, open source en te delen met anderen.',
    });
  }
}
