export interface Vehicle {
  id: number;
  naam: string;
  merk?: string;
  type?: string;
  bouwjaar?: number;
  aankoopdatum?: string;
  /** Total Cost of Ownership: bedragen in euro's, allemaal optioneel. */
  aanschafprijs?: number | null;
  /** Minimale restwaarde; ondergrens van de lineaire afschrijving. */
  restwaarde?: number | null;
  /** Degressief: per leeftijd (jaren sinds bouwjaar) een percentage van de resterende waarde per maand. */
  afschrijvingstabel: AfschrijvingsStaffel[];
  verkoopdatum?: string | null;
  /** Werkelijke verkoopprijs; na verkoop is de afschrijving aanschafprijs − verkoopprijs. */
  verkoopprijs?: number | null;
  isOwner: boolean;
  eigenaarNaam: string;
  fotoThumbnailDataUrl?: string;
}

export interface AfschrijvingsStaffel {
  /** Vanaf deze leeftijd in jaren (t.o.v. het bouwjaar) geldt dit percentage, tot de volgende staffel. */
  vanafLeeftijd: number;
  /** Bv. 1.35 voor 1,35% van de resterende waarde per maand. */
  percentagePerMaand: number;
}

export type VehicleRequest = Omit<Vehicle, 'id' | 'isOwner' | 'eigenaarNaam' | 'fotoThumbnailDataUrl'>;

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
  /** Total Cost of Ownership: brandstof + onderhoud + vaste lasten t/m vandaag + afschrijving. */
  totaleKosten: number;
  brandstofKosten: number;
  onderhoudsKosten: number;
  vasteLasten: number;
  /** Per maand het percentage bij de leeftijd over de resterende waarde tot de restwaarde, of na verkoop aanschafprijs − verkoopprijs. */
  afschrijving: number;
  /** Aanschafprijs − afschrijving (of de verkoopprijs); null zonder aanschafprijs. */
  boekwaarde: number | null;
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
