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
  attachments: MaintenanceAttachment[];
}

export type MaintenanceEntryRequest = Omit<
  MaintenanceEntry,
  'id' | 'vehicleId' | 'maintenanceTypeNaam' | 'attachments'
>;

export interface VehicleStats {
  vehicleId: number;
  totaleKosten: number;
  totaalLiters: number;
  gemiddeldeVerbruikL100km: number;
  gemiddeldePrijsPerLiter: number;
  laatsteOdometer: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export type AdminUserUpdate = Pick<AdminUser, 'email' | 'name' | 'isAdmin'>;
