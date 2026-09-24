import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle';
import { AuthService } from '../../../core/services/auth';
import { Vehicle, VehicleRequest } from '../../../core/models/models';
import { DEFAULT_DEPRECIATION_TEMPLATE, copyStaffels } from '../../../core/models/depreciation-templates';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.scss',
})
export class VehicleList implements OnInit {
  readonly vehicles = signal<Vehicle[]>([]);
  readonly showForm = signal(false);

  newVehicle: VehicleRequest = this.emptyVehicle();

  constructor(
    private vehicleService: VehicleService,
    readonly authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.vehicleService.getAll().subscribe((vehicles) => this.vehicles.set(vehicles));
  }

  addVehicle(): void {
    this.vehicleService.create(this.newVehicle).subscribe(() => {
      this.newVehicle = this.emptyVehicle();
      this.showForm.set(false);
      this.load();
    });
  }

  // Nieuwe voertuigen krijgen altijd de standaard afschrijvingstabel als basis; aan te passen op de detailpagina.
  private emptyVehicle(): VehicleRequest {
    return {
      naam: '',
      merk: '',
      type: '',
      bouwjaar: undefined,
      aankoopdatum: undefined,
      afschrijvingstabel: copyStaffels(DEFAULT_DEPRECIATION_TEMPLATE.staffels),
    };
  }

  deleteVehicle(id: number): void {
    if (!confirm('Weet je zeker dat je dit voertuig wilt verwijderen? Alle tankbeurten en onderhoud gaan ook mee.')) return;
    this.vehicleService.delete(id).subscribe(() => this.load());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
