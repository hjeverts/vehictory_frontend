import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CategoryScale,
  ChartConfiguration,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import { VehicleService } from '../../../core/services/vehicle';
import { FuelEntryService } from '../../../core/services/fuel-entry';
import { MaintenanceService } from '../../../core/services/maintenance';
import { RecurringCostService } from '../../../core/services/recurring-cost';
import {
  FuelEntry,
  FuelEntryRequest,
  MaintenanceEntry,
  MaintenanceEntryRequest,
  MaintenanceType,
  RecurringCost,
  RecurringCostRequest,
  Vehicle,
  VehicleRequest,
  VehicleShare,
  VehicleStats,
} from '../../../core/models/models';

type FuelEntryWithVerbruik = FuelEntry & {
  afstandKm: number | null;
  verbruikL100km: number | null;
};

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BaseChartDirective],
  // Alleen de Chart.js-onderdelen voor lijngrafieken, zodat Chart.js in de lazy chunk van deze pagina blijft.
  providers: [
    provideCharts({
      registerables: [LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend],
    }),
  ],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.scss',
})
export class VehicleDetail implements OnInit, OnDestroy {
  vehicleId!: number;
  readonly fuelTypes = [
    'Benzine E10 (Euro 95)',
    'Benzine E5 (Euro 95)',
    'Super Plus 98 (E5)',
    'Diesel B7',
    'Diesel B10',
    'LPG',
    'CNG',
    'HVO100',
    'Elektrisch',
  ];
  readonly vehicle = signal<Vehicle | null>(null);
  readonly photoUrl = signal<string | null>(null);
  private photoObjectUrl: string | null = null;
  readonly stats = signal<VehicleStats | null>(null);
  readonly fuelEntries = signal<FuelEntry[]>([]);
  readonly fuelEntriesWithVerbruik = computed<FuelEntryWithVerbruik[]>(() => {
    const entries = this.fuelEntries();
    const byOdometer = [...entries].sort((a, b) => a.odometer - b.odometer);
    const valuesPerId = new Map<number, Pick<FuelEntryWithVerbruik, 'afstandKm' | 'verbruikL100km'>>();
    let previousEntry: FuelEntry | null = null;

    for (const entry of byOdometer) {
      const afstandKm = previousEntry ? entry.odometer - previousEntry.odometer : null;
      if (previousEntry && !entry.vergeten && afstandKm !== null && afstandKm > 0) {
        valuesPerId.set(entry.id, {
          afstandKm,
          verbruikL100km: (entry.volume / afstandKm) * 100,
        });
      } else {
        valuesPerId.set(entry.id, { afstandKm: null, verbruikL100km: null });
      }
      previousEntry = entry;
    }

    return entries.map((entry) => ({ ...entry, ...valuesPerId.get(entry.id)! }));
  });
  readonly consumptionChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const entries = this.chartEntries().filter((entry) => entry.verbruikL100km !== null);
    return this.createLineChartData(
      entries,
      'Verbruik (L/100 km)',
      entries.map((entry) => entry.verbruikL100km!),
      '#2563eb',
    );
  });
  readonly fuelPriceChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const entries = this.chartEntries().filter((entry) => entry.volume > 0);
    return this.createLineChartData(
      entries,
      'Brandstofprijs (EUR/L)',
      entries.map((entry) => entry.bedrag / entry.volume),
      '#059669',
    );
  });
  readonly fuelCostChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const entries = this.chartEntries();
    return this.createLineChartData(
      entries,
      'Kosten per tankbeurt (EUR)',
      entries.map((entry) => entry.bedrag),
      '#d97706',
    );
  });
  readonly distancePeriod = signal<'maand' | 'jaar'>('maand');
  readonly distanceChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const perMonth = this.distancePeriod() === 'maand';
    // Gereden afstand op basis van km-standen, ook over "vergeten"-intervallen, zodat de som
    // gelijk is aan de totale afstand. Elk interval telt mee in de periode van de latere tankbeurt.
    const byOdometer = [...this.fuelEntries()].sort((a, b) => a.odometer - b.odometer);
    const totals = new Map<string, number>();
    for (let i = 1; i < byOdometer.length; i++) {
      const entry = byOdometer[i];
      const key = perMonth ? entry.datum.slice(0, 7) : entry.datum.slice(0, 4);
      totals.set(key, (totals.get(key) ?? 0) + entry.odometer - byOdometer[i - 1].odometer);
    }
    const keys = this.periodRange([...totals.keys()], perMonth);
    return {
      labels: keys.map((key) => (perMonth ? this.formatMonth(key) : key)),
      datasets: [{
        label: 'Afstand (km)',
        data: keys.map((key) => totals.get(key) ?? 0),
        borderColor: '#7c3aed',
        backgroundColor: '#7c3aed26',
        fill: true,
        tension: 0.25,
      }],
    };
  });
  readonly costPeriod = signal<'maand' | 'jaar'>('maand');
  /** Werkelijk gemaakte kosten per periode (geen extrapolatie), per categorie en in totaal. */
  readonly costChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const perMonth = this.costPeriod() === 'maand';
    const periodKey = (datum: string) => (perMonth ? datum.slice(0, 7) : datum.slice(0, 4));
    const sumPerPeriod = (items: { datum: string; bedrag: number }[]) => {
      const totals = new Map<string, number>();
      for (const item of items) totals.set(periodKey(item.datum), (totals.get(periodKey(item.datum)) ?? 0) + item.bedrag);
      return totals;
    };
    const brandstof = sumPerPeriod(this.fuelEntries().map((entry) => ({ datum: entry.datum, bedrag: entry.bedrag })));
    const onderhoud = sumPerPeriod(
      this.maintenanceEntries()
        .filter((entry) => entry.kosten != null)
        .map((entry) => ({ datum: entry.datum, bedrag: entry.kosten! })),
    );
    const vasteLasten = sumPerPeriod(this.recurringPayments());
    const keys = this.periodRange([...brandstof.keys(), ...onderhoud.keys(), ...vasteLasten.keys()], perMonth);
    const series = (totals: Map<string, number>) => keys.map((key) => totals.get(key) ?? 0);
    const dataset = (label: string, data: number[], color: string, fill = false) => ({
      label,
      data,
      borderColor: color,
      backgroundColor: fill ? `${color}26` : color,
      fill,
      tension: 0.25,
    });
    return {
      labels: keys.map((key) => (perMonth ? this.formatMonth(key) : key)),
      datasets: [
        dataset('Totaal (EUR)', keys.map((key) => (brandstof.get(key) ?? 0) + (onderhoud.get(key) ?? 0) + (vasteLasten.get(key) ?? 0)), '#0f766e', true),
        dataset('Brandstof (EUR)', series(brandstof), '#d97706'),
        dataset('Onderhoud (EUR)', series(onderhoud), '#2563eb'),
        dataset('Vaste lasten (EUR)', series(vasteLasten), '#7c3aed'),
      ],
    };
  });
  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };
  readonly maintenanceEntries = signal<MaintenanceEntry[]>([]);
  readonly maintenanceTypes = signal<MaintenanceType[]>([]);
  readonly showNewTypeForm = signal(false);
  readonly maintenanceTypeError = signal<string | null>(null);
  readonly maintenanceAttachmentError = signal<string | null>(null);
  newTypeName = '';
  readonly shares = signal<VehicleShare[]>([]);
  readonly shareError = signal<string | null>(null);
  readonly vehicleError = signal<string | null>(null);
  readonly vehicleMessage = signal<string | null>(null);
  newShareEmail = '';
  editVehicle: VehicleRequest = { naam: '', merk: '', type: '', bouwjaar: undefined, aankoopdatum: undefined };

  readonly activeTab = signal<'brandstof' | 'onderhoud' | 'vaste-lasten'>('brandstof');
  readonly recurringCosts = signal<RecurringCost[]>([]);
  readonly recurringCostError = signal<string | null>(null);
  readonly editingRecurringCostId = signal<number | null>(null);
  readonly showAllRecurringPayments = signal(false);
  readonly recurringCostSoorten: RecurringCost['soort'][] = ['Wegenbelasting', 'Verzekering'];
  readonly recurringCostFrequenties: RecurringCost['frequentie'][] = ['Maand', 'Kwartaal', 'Jaar'];
  /** Alle automatisch ingevulde termijnen van alle posten, nieuwste eerst. */
  readonly recurringPayments = computed(() =>
    this.recurringCosts()
      .flatMap((cost) => cost.termijnen.map((datum) => ({ datum, soort: cost.soort, bedrag: cost.bedrag, costId: cost.id })))
      .sort((a, b) => b.datum.localeCompare(a.datum)),
  );
  readonly visibleRecurringPayments = computed(() =>
    this.showAllRecurringPayments()
      ? this.recurringPayments()
      : this.recurringPayments().slice(0, this.visibleEntryCount),
  );
  newRecurringCost: RecurringCostRequest = this.emptyRecurringCost();
  readonly editingVehicle = signal(false);
  readonly showAllFuelEntries = signal(false);
  readonly showAllMaintenanceEntries = signal(false);
  readonly visibleEntryCount = 10;
  readonly visibleFuelEntries = computed(() =>
    this.showAllFuelEntries()
      ? this.fuelEntriesWithVerbruik()
      : this.fuelEntriesWithVerbruik().slice(0, this.visibleEntryCount),
  );
  readonly visibleMaintenanceEntries = computed(() =>
    this.showAllMaintenanceEntries()
      ? this.maintenanceEntries()
      : this.maintenanceEntries().slice(0, this.visibleEntryCount),
  );

  newFuelEntry: FuelEntryRequest = {
    datum: new Date().toISOString().slice(0, 10),
    odometer: 0,
    brandstofType: '',
    volume: 0,
    bedrag: 0,
    tankstation: '',
    vergeten: false,
  };

  newMaintenanceEntry: MaintenanceEntryRequest = this.emptyMaintenanceEntry();
  readonly editingMaintenanceEntryId = signal<number | null>(null);
  readonly maintenanceError = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private fuelEntryService: FuelEntryService,
    private maintenanceService: MaintenanceService,
    private recurringCostService: RecurringCostService,
  ) {}

  ngOnInit(): void {
    this.vehicleId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.maintenanceService.getTypes().subscribe((types) => this.maintenanceTypes.set(types));
  }

  ngOnDestroy(): void {
    this.revokePhotoObjectUrl();
  }

  load(): void {
    this.vehicleService.getById(this.vehicleId).subscribe((v) => {
      this.vehicle.set(v);
      this.editVehicle = {
        naam: v.naam,
        merk: v.merk ?? '',
        type: v.type ?? '',
        bouwjaar: v.bouwjaar,
        aankoopdatum: v.aankoopdatum,
      };
      // Toon meteen de kleine thumbnail (komt al inline mee); de scherpe foto wordt
      // lazy nagehaald via een los endpoint zodat de detailpagina niet 850KB+ JSON laadt.
      this.setPhotoUrl(v.fotoThumbnailDataUrl ?? null);
      if (v.fotoThumbnailDataUrl) {
        this.vehicleService.getPhoto(this.vehicleId).subscribe((blob) => this.setPhotoBlob(blob));
      }
      if (v.isOwner) {
        this.vehicleService.getShares(this.vehicleId).subscribe((shares) => this.shares.set(shares));
      }
    });
    this.vehicleService.getStats(this.vehicleId).subscribe((s) => this.stats.set(s));
    this.fuelEntryService.getAll(this.vehicleId).subscribe((entries) => this.fuelEntries.set(entries));
    this.maintenanceService.getAll(this.vehicleId).subscribe((entries) => this.maintenanceEntries.set(entries));
    this.recurringCostService.getAll(this.vehicleId).subscribe((costs) => this.recurringCosts.set(costs));
  }

  private setPhotoUrl(url: string | null): void {
    this.revokePhotoObjectUrl();
    this.photoUrl.set(url);
  }

  private setPhotoBlob(blob: Blob): void {
    this.revokePhotoObjectUrl();
    this.photoObjectUrl = URL.createObjectURL(blob);
    this.photoUrl.set(this.photoObjectUrl);
  }

  private revokePhotoObjectUrl(): void {
    if (this.photoObjectUrl) {
      URL.revokeObjectURL(this.photoObjectUrl);
      this.photoObjectUrl = null;
    }
  }

  addFuelEntry(): void {
    this.fuelEntryService.create(this.vehicleId, this.newFuelEntry).subscribe(() => {
      this.newFuelEntry = {
        datum: new Date().toISOString().slice(0, 10),
        odometer: 0,
        brandstofType: '',
        volume: 0,
        bedrag: 0,
        tankstation: '',
        vergeten: false,
      };
      this.load();
    });
  }

  deleteFuelEntry(id: number): void {
    this.fuelEntryService.delete(this.vehicleId, id).subscribe(() => this.load());
  }

  saveMaintenanceEntry(): void {
    if (!this.newMaintenanceEntry.maintenanceTypeId) return;
    this.maintenanceError.set(null);
    const request: MaintenanceEntryRequest = {
      ...this.newMaintenanceEntry,
      maintenanceTypeId: Number(this.newMaintenanceEntry.maintenanceTypeId),
      kosten: this.newMaintenanceEntry.kosten ?? null,
    };
    const id = this.editingMaintenanceEntryId();
    const save$ = id === null
      ? this.maintenanceService.create(this.vehicleId, request)
      : this.maintenanceService.update(this.vehicleId, id, request);
    save$.subscribe({
      next: () => {
        this.cancelEditMaintenanceEntry();
        this.load();
      },
      error: (err) => this.maintenanceError.set(
        typeof err?.error === 'string' ? err.error : 'Onderhoud opslaan mislukt.',
      ),
    });
  }

  editMaintenanceEntry(entry: MaintenanceEntry): void {
    this.newMaintenanceEntry = {
      datum: entry.datum,
      odometer: entry.odometer,
      maintenanceTypeId: entry.maintenanceTypeId,
      notitie: entry.notitie ?? '',
      kosten: entry.kosten ?? null,
    };
    this.maintenanceError.set(null);
    this.editingMaintenanceEntryId.set(entry.id);
  }

  cancelEditMaintenanceEntry(): void {
    this.newMaintenanceEntry = this.emptyMaintenanceEntry();
    this.editingMaintenanceEntryId.set(null);
  }

  private emptyMaintenanceEntry(): MaintenanceEntryRequest {
    return {
      datum: new Date().toISOString().slice(0, 10),
      odometer: 0,
      maintenanceTypeId: 0,
      notitie: '',
      kosten: null,
    };
  }

  deleteMaintenanceEntry(id: number): void {
    this.maintenanceService.delete(this.vehicleId, id).subscribe(() => {
      if (this.editingMaintenanceEntryId() === id) this.cancelEditMaintenanceEntry();
      this.load();
    });
  }

  addMaintenanceType(): void {
    const naam = this.newTypeName.trim();
    if (!naam) return;
    this.maintenanceTypeError.set(null);
    this.maintenanceService.createType(naam).subscribe({
      next: (type) => {
        this.maintenanceTypes.update((types) => [...types, type].sort((a, b) => a.naam.localeCompare(b.naam)));
        this.newMaintenanceEntry.maintenanceTypeId = type.id;
        this.newTypeName = '';
        this.showNewTypeForm.set(false);
      },
      error: (err) => this.maintenanceTypeError.set(err?.error ?? 'Onderhoudstype toevoegen mislukt.'),
    });
  }

  uploadMaintenanceAttachment(entryId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.maintenanceAttachmentError.set(null);
    this.maintenanceService.uploadAttachment(this.vehicleId, entryId, file).subscribe({
      next: () => {
        input.value = '';
        this.load();
      },
      error: (err) => this.maintenanceAttachmentError.set(err?.error ?? 'Bijlage uploaden mislukt.'),
    });
  }

  deleteMaintenanceAttachment(entryId: number, attachmentId: number): void {
    this.maintenanceService.deleteAttachment(this.vehicleId, entryId, attachmentId).subscribe(() => this.load());
  }

  openMaintenanceAttachment(entryId: number, attachmentId: number): void {
    this.maintenanceService.downloadAttachment(this.vehicleId, entryId, attachmentId).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  saveRecurringCost(): void {
    this.recurringCostError.set(null);
    const request: RecurringCostRequest = { ...this.newRecurringCost, einddatum: this.newRecurringCost.einddatum || null };
    const id = this.editingRecurringCostId();
    const save$ = id === null
      ? this.recurringCostService.create(this.vehicleId, request)
      : this.recurringCostService.update(this.vehicleId, id, request);
    save$.subscribe({
      next: () => {
        this.cancelEditRecurringCost();
        this.load();
      },
      error: (err) => this.recurringCostError.set(
        typeof err?.error === 'string' ? err.error : 'Vaste last opslaan mislukt.',
      ),
    });
  }

  editRecurringCost(cost: RecurringCost): void {
    this.newRecurringCost = {
      soort: cost.soort,
      bedrag: cost.bedrag,
      frequentie: cost.frequentie,
      startdatum: cost.startdatum,
      einddatum: cost.einddatum ?? null,
      notitie: cost.notitie ?? '',
    };
    this.recurringCostError.set(null);
    this.editingRecurringCostId.set(cost.id);
  }

  cancelEditRecurringCost(): void {
    this.newRecurringCost = this.emptyRecurringCost();
    this.editingRecurringCostId.set(null);
  }

  deleteRecurringCost(id: number): void {
    if (!confirm('Deze vaste last en alle bijbehorende termijnen verwijderen?')) return;
    this.recurringCostService.delete(this.vehicleId, id).subscribe(() => {
      if (this.editingRecurringCostId() === id) this.cancelEditRecurringCost();
      this.load();
    });
  }

  private emptyRecurringCost(): RecurringCostRequest {
    return {
      soort: 'Wegenbelasting',
      bedrag: 0,
      frequentie: 'Kwartaal',
      startdatum: new Date().toISOString().slice(0, 10),
      einddatum: null,
      notitie: '',
    };
  }

  addShare(): void {
    if (!this.newShareEmail.trim()) return;
    this.shareError.set(null);
    this.vehicleService.addShare(this.vehicleId, this.newShareEmail.trim()).subscribe({
      next: (share) => {
        this.shares.update((shares) => [...shares, share]);
        this.newShareEmail = '';
      },
      error: (err) => {
        this.shareError.set(err?.error ?? 'Kon dit voertuig niet delen. Controleer het e-mailadres.');
      },
    });
  }

  removeShare(userId: string): void {
    this.vehicleService.removeShare(this.vehicleId, userId).subscribe(() => {
      this.shares.update((shares) => shares.filter((s) => s.userId !== userId));
    });
  }

  editVehicleForm(): void {
    const v = this.vehicle();
    if (!v) return;
    this.editVehicle = {
      naam: v.naam,
      merk: v.merk ?? '',
      type: v.type ?? '',
      bouwjaar: v.bouwjaar,
      aankoopdatum: v.aankoopdatum,
    };
    this.vehicleError.set(null);
    this.vehicleMessage.set(null);
    this.editingVehicle.set(true);
  }

  cancelEditVehicle(): void {
    this.editingVehicle.set(false);
  }

  saveVehicle(): void {
    this.vehicleError.set(null);
    this.vehicleMessage.set(null);
    this.vehicleService.update(this.vehicleId, this.editVehicle).subscribe({
      next: () => {
        this.vehicleMessage.set('Voertuiggegevens opgeslagen.');
        this.editingVehicle.set(false);
        this.load();
      },
      error: (err) => this.vehicleError.set(err.error ?? 'Voertuiggegevens opslaan mislukt.'),
    });
  }

  uploadVehiclePhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.vehicleError.set(null);
    this.vehicleMessage.set(null);
    this.vehicleService.updatePhoto(this.vehicleId, file).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.setPhotoBlob(file);
        this.vehicleMessage.set('Voertuigfoto bijgewerkt.');
      },
      error: (err) => this.vehicleError.set(err.error ?? 'Voertuigfoto uploaden mislukt.'),
    });
  }

  private chartEntries(): FuelEntryWithVerbruik[] {
    return [...this.fuelEntriesWithVerbruik()].sort((a, b) => a.datum.localeCompare(b.datum));
  }

  private createLineChartData(
    entries: FuelEntryWithVerbruik[],
    label: string,
    data: number[],
    color: string,
  ): ChartConfiguration<'line'>['data'] {
    return {
      labels: entries.map((entry) => this.formatDate(entry.datum)),
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}26`,
        fill: true,
        tension: 0.25,
      }],
    };
  }

  /** Alle periodes van de eerste t/m de laatste sleutel, zodat periodes zonder afstand als 0 verschijnen. */
  private periodRange(keys: string[], perMonth: boolean): string[] {
    if (keys.length === 0) return [];
    const sorted = [...keys].sort();
    const [firstYear, firstMonth] = sorted[0].split('-').map(Number);
    const [lastYear, lastMonth] = sorted[sorted.length - 1].split('-').map(Number);
    const range: string[] = [];
    if (!perMonth) {
      for (let year = firstYear; year <= lastYear; year++) range.push(String(year));
      return range;
    }
    for (let year = firstYear, month = firstMonth; year < lastYear || (year === lastYear && month <= lastMonth); ) {
      range.push(`${year}-${String(month).padStart(2, '0')}`);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    return range;
  }

  private formatMonth(key: string): string {
    return new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric' }).format(new Date(`${key}-01T00:00:00`));
  }

  private formatDate(date: string): string {
    return new Intl.DateTimeFormat('nl-NL').format(new Date(`${date}T00:00:00`));
  }
}
