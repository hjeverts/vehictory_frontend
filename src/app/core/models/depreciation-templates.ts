import { AfschrijvingsStaffel } from './models';

export interface DepreciationTemplate {
  naam: string;
  staffels: AfschrijvingsStaffel[];
}

/**
 * Vuistregels voor het waardeverlies per jaar, per leeftijd van de auto (jaren sinds bouwjaar), omgerekend naar
 * een percentage per maand over de resterende waarde: 1 − (1 − perJaar)^(1/12). Bedoeld als startpunt; de
 * gebruiker kan de tabel per voertuig aanpassen.
 */
export const DEPRECIATION_TEMPLATES: DepreciationTemplate[] = [
  {
    naam: 'Standaard (benzine/diesel/hybride)',
    staffels: [
      { vanafLeeftijd: 0, percentagePerMaand: 1.84 }, // ≈ 20% per jaar
      { vanafLeeftijd: 1, percentagePerMaand: 1.35 }, // ≈ 15%
      { vanafLeeftijd: 2, percentagePerMaand: 1.15 }, // ≈ 13%
      { vanafLeeftijd: 3, percentagePerMaand: 0.97 }, // ≈ 11%
      { vanafLeeftijd: 5, percentagePerMaand: 0.78 }, // ≈ 9%
      { vanafLeeftijd: 8, percentagePerMaand: 0.6 }, // ≈ 7%
      { vanafLeeftijd: 12, percentagePerMaand: 0.43 }, // ≈ 5%
    ],
  },
  {
    naam: 'Elektrisch',
    staffels: [
      { vanafLeeftijd: 0, percentagePerMaand: 2.37 }, // ≈ 25% per jaar
      { vanafLeeftijd: 1, percentagePerMaand: 1.64 }, // ≈ 18%
      { vanafLeeftijd: 2, percentagePerMaand: 1.25 }, // ≈ 14%
      { vanafLeeftijd: 3, percentagePerMaand: 1.06 }, // ≈ 12%
      { vanafLeeftijd: 5, percentagePerMaand: 0.87 }, // ≈ 10%
      { vanafLeeftijd: 8, percentagePerMaand: 0.69 }, // ≈ 8%
    ],
  },
];

export const DEFAULT_DEPRECIATION_TEMPLATE = DEPRECIATION_TEMPLATES[0];

export function copyStaffels(staffels: AfschrijvingsStaffel[]): AfschrijvingsStaffel[] {
  return staffels.map((staffel) => ({ ...staffel }));
}

/** Percentage per maand dat over een jaar (samengesteld) hetzelfde waardeverlies geeft. */
export function yearlyDepreciation(percentagePerMaand: number | null | undefined): number | null {
  return percentagePerMaand ? (1 - Math.pow(1 - percentagePerMaand / 100, 12)) * 100 : null;
}

/** Percentage per maand bij een leeftijd: de staffel met de hoogste vanafLeeftijd ≤ leeftijd (zoals de backend). */
export function percentageForAge(staffels: AfschrijvingsStaffel[], leeftijd: number): number {
  let match: AfschrijvingsStaffel | undefined;
  for (const staffel of staffels) {
    if (staffel.vanafLeeftijd <= leeftijd && (!match || staffel.vanafLeeftijd > match.vanafLeeftijd)) match = staffel;
  }
  return match?.percentagePerMaand ?? 0;
}
