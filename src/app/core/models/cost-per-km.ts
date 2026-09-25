/** Een bedrag of afstand die gelijkmatig over de dagen van [van, tot) wordt verdeeld; bij tot <= van valt alles op van. */
export interface Spreiding {
  van: string;
  tot: string;
  waarde: number;
}

const DAG_MS = 86_400_000;

/** Tel spreidingen op per maand (sleutel 'jjjj-mm'), naar rato van het aantal dagen in elke maand. */
export function perMaand(items: Spreiding[]): Map<string, number> {
  const totals = new Map<string, number>();
  const add = (key: string, value: number) => totals.set(key, (totals.get(key) ?? 0) + value);
  for (const item of items) {
    const start = Date.parse(`${item.van}T00:00:00Z`);
    const end = Date.parse(`${item.tot}T00:00:00Z`);
    if (!(end > start)) {
      add(item.van.slice(0, 7), item.waarde);
      continue;
    }
    for (let cursor = start; cursor < end; ) {
      const date = new Date(cursor);
      const segmentEnd = Math.min(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1), end);
      add(date.toISOString().slice(0, 7), (item.waarde * (segmentEnd - cursor)) / (end - start));
      cursor = segmentEnd;
    }
  }
  return totals;
}

/**
 * Onderhoudskosten uitgesmeerd over de periode tot de volgende beurt van hetzelfde type (6 t/m 36 maanden), zodat
 * een grote beurt geen piek geeft. Voor de laatste beurt van een type geldt het vorige interval, anders 12 maanden.
 */
export function spreidOnderhoud(
  entries: { datum: string; maintenanceTypeId: number; kosten?: number | null }[],
): Spreiding[] {
  const perType = new Map<number, string[]>();
  for (const entry of entries) {
    perType.set(entry.maintenanceTypeId, [...(perType.get(entry.maintenanceTypeId) ?? []), entry.datum]);
  }
  for (const datums of perType.values()) datums.sort();

  return entries
    .filter((entry) => entry.kosten != null && entry.kosten !== 0)
    .map((entry) => {
      const datums = perType.get(entry.maintenanceTypeId)!;
      const index = datums.lastIndexOf(entry.datum);
      const volgende = datums.slice(index + 1).find((datum) => datum > entry.datum);
      const vorige = datums.slice(0, index).reverse().find((datum) => datum < entry.datum);
      let tot = volgende ?? (vorige ? addDays(entry.datum, daysBetween(vorige, entry.datum)) : addMonths(entry.datum, 12));
      const min = addMonths(entry.datum, 6);
      const max = addMonths(entry.datum, 36);
      if (tot < min) tot = min;
      if (tot > max) tot = max;
      return { van: entry.datum, tot, waarde: entry.kosten! };
    });
}

/**
 * Voortschrijdend gemiddelde over de laatste `venster` maanden: som van de kosten gedeeld door de som van de
 * kilometers in dat venster (niet het gemiddelde van maandverhoudingen, zodat maanden met weinig km niet domineren).
 * Aan het begin groeit het venster mee; de eerste twee maanden blijven leeg omdat die te weinig zeggen.
 */
export function voortschrijdendPerKm(
  maanden: string[],
  kosten: Map<string, number>,
  km: Map<string, number>,
  venster: number,
): (number | null)[] {
  const minimaal = Math.min(3, maanden.length);
  return maanden.map((_, i) => {
    const window = maanden.slice(Math.max(0, i - venster + 1), i + 1);
    if (window.length < minimaal) return null;
    const kmSom = window.reduce((sum, maand) => sum + (km.get(maand) ?? 0), 0);
    const kostenSom = window.reduce((sum, maand) => sum + (kosten.get(maand) ?? 0), 0);
    return kmSom > 0 ? kostenSom / kmSom : null;
  });
}

/** Lineaire trend (kleinste kwadraten) door de gevulde punten; `helling` is de verandering per stap (maand). */
export function lineaireTrend(values: (number | null)[]): { waarden: (number | null)[]; helling: number | null } {
  const points = values.flatMap((y, x) => (y === null ? [] : [{ x, y }]));
  if (points.length < 2) return { waarden: values.map(() => null), helling: null };
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const sxx = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  const sxy = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
  const helling = sxy / sxx;
  const first = points[0].x;
  const last = points[points.length - 1].x;
  return {
    waarden: values.map((_, x) => (x >= first && x <= last ? meanY + helling * (x - meanX) : null)),
    helling,
  };
}

/** Zelfde semantiek als DateOnly.AddMonths: een te grote dag wordt de laatste dag van de maand. */
export function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const totalMonths = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAG_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAG_MS);
}
