export interface Vehicle {
  id: number;
  naam: string;
  merk?: string;
  type?: string;
  bouwjaar?: number;
  aankoopdatum?: string;
  isOwner: boolean;
  eigenaarNaam: string;
  fotoThumbnailDataUrl?: string;
}

export type VehicleRequest = Omit<Vehicle, 'id' | 'isOwner' | 'eigenaarNaam'>;

export interface VehicleShare {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface FuelEntry {
  id: number;
  vehicleId: number;
  datum: string;
  odometer: number;
  brandstofType?: string;
  volume: number;
  bedrag: number;
  tankstation?: string;
  vergeten: boolean;
}

export type FuelEntryRequest = Omit<FuelEntry, 'id' | 'vehicleId'>;

export interface MaintenanceType {
  id: number;
  naam: string;
}

export interface MaintenanceAttachment {
  id: number;
  fileName: string;
  contentType: string;
  isImage: boolean;
  thumbnailDataUrl?: string;
}

export interface MaintenanceEntry {
  id: number;
  vehicleId: number;
  datum: string;
  odometer: number;
  maintenanceTypeId: number;
  maintenanceTypeNaam: string;
  notitie?: string;
  kosten?: number | null;
  attachments: MaintenanceAttachment[];
}

export type MaintenanceEntryRequest = Omit<
  MaintenanceEntry,
  'id' | 'vehicleId' | 'maintenanceTypeNaam' | 'attachments'
>;

export type RecurringCostSoort = 'Wegenbelasting' | 'Verzekering';
export type RecurringCostFrequentie = 'Maand' | 'Kwartaal' | 'Jaar';

export interface RecurringCost {
  id: number;
  vehicleId: number;
  soort: RecurringCostSoort;
  bedrag: number;
  frequentie: RecurringCostFrequentie;
  startdatum: string;
  einddatum?: string | null;
  notitie?: string | null;
  /** Automatisch afgeleide betaaldatums t/m vandaag. */
  termijnen: string[];
  totaalBetaald: number;
  volgendeTermijn?: string | null;
}

export type RecurringCostRequest = Omit<
  RecurringCost,
  'id' | 'vehicleId' | 'termijnen' | 'totaalBetaald' | 'volgendeTermijn'
>;

export interface VehicleStats {
  vehicleId: number;
  /** Brandstof + onderhoud + vaste lasten t/m vandaag. */
  totaleKosten: number;
  brandstofKosten: number;
  onderhoudsKosten: number;
  vasteLasten: number;
  totaalLiters: number;
  gemiddeldeVerbruikL100km: number;
  gemiddeldePrijsPerLiter: number;
  laatsteOdometer: number;
  /** Hoogste − laagste km-stand van de tankbeurten. */
  totaleAfstandKm: number;
  kostenPerKm: number | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export type AdminUserUpdate = Pick<AdminUser, 'email' | 'name' | 'isAdmin'>;
