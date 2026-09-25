import { lineaireTrend, perMaand, spreidOnderhoud, voortschrijdendPerKm } from './cost-per-km';

describe('cost-per-km', () => {
  it('verdeelt een spreiding naar rato van de dagen per maand', () => {
    // 1 jan t/m 28 feb 2025: 31 + 28 = 59 dagen.
    const totals = perMaand([{ van: '2025-01-01', tot: '2025-03-01', waarde: 590 }]);
    expect(totals.get('2025-01')).toBeCloseTo(310);
    expect(totals.get('2025-02')).toBeCloseTo(280);
  });

  it('boekt een spreiding zonder duur op de begindatum', () => {
    expect(perMaand([{ van: '2025-05-10', tot: '2025-05-10', waarde: 50 }]).get('2025-05')).toBe(50);
  });

  it('smeert onderhoud uit tot de volgende beurt van hetzelfde type, begrensd op 6 t/m 36 maanden', () => {
    const spreidingen = spreidOnderhoud([
      { datum: '2020-01-01', maintenanceTypeId: 1, kosten: 400 },
      { datum: '2022-01-01', maintenanceTypeId: 1, kosten: 300 },
      { datum: '2022-02-01', maintenanceTypeId: 2, kosten: 100 },
      { datum: '2022-03-01', maintenanceTypeId: 2, kosten: 50 },
      { datum: '2022-03-01', maintenanceTypeId: 3, kosten: null },
    ]);
    expect(spreidingen).toEqual([
      { van: '2020-01-01', tot: '2022-01-01', waarde: 400 },
      // Laatste van type 1: zelfde interval als de vorige (731 dagen).
      { van: '2022-01-01', tot: '2024-01-02', waarde: 300 },
      // Volgende beurt na één maand: minimaal 6 maanden.
      { van: '2022-02-01', tot: '2022-08-01', waarde: 100 },
      { van: '2022-03-01', tot: '2022-09-01', waarde: 50 },
    ]);
  });

  it('deelt de kosten door de kilometers binnen het venster', () => {
    const maanden = ['2025-01', '2025-02', '2025-03', '2025-04'];
    const kosten = new Map([['2025-01', 100], ['2025-02', 100], ['2025-03', 100], ['2025-04', 400]]);
    const km = new Map([['2025-01', 1000], ['2025-02', 1000], ['2025-03', 1000], ['2025-04', 1000]]);
    expect(voortschrijdendPerKm(maanden, kosten, km, 3)).toEqual([null, null, 0.1, 0.2]);
  });

  it('berekent een lineaire trend door de gevulde punten', () => {
    const { waarden, helling } = lineaireTrend([null, 1, 2, 3]);
    expect(helling).toBeCloseTo(1);
    expect(waarden[0]).toBeNull();
    expect(waarden[3]).toBeCloseTo(3);
  });
});
