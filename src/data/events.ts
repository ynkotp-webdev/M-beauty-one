// Тимчасові прайси. Після endDate блок не виводиться (перевірка під час збірки).
export type TimedPrice = { id: string; title: string; source: string; endDate: string; rows: { slot: string; price: number }[]; notes: string[] };

export const timed: TimedPrice[] = [
  {
    id: 'nye-2026',
    title: '31 грудня',
    source: 'Прайс салону від 12 листопада 2026 року',
    endDate: '2026-12-31',
    rows: [
      { slot: '09:00–12:00', price: 2000 },
      { slot: '12:00–15:00', price: 2500 },
      { slot: '16:00–17:00', price: 3000 },
      { slot: '18:00 і 19:00', price: 4000 },
    ],
    notes: ['Ціна за волосся або макіяж.', 'Манікюр, педикюр, стрижка і фарбування: +25 % до обраної послуги.', 'Запис із авансом.'],
  },
];

/** Тільки ті, чий термін ще не минув. */
export const active = (today = new Date()) => timed.filter((e) => today <= new Date(`${e.endDate}T23:59:59`));
