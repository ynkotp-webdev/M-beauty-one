// Факти з content/salon.md. Нічого не вигадувати: чого тут немає, того немає на сайті.
export const salon = {
  name: 'M Beauty One',
  address: 'пл. Євгена Маланюка, 4',
  city: 'Львів',
  phone: '+380734083608',
  phoneText: '073 408 36 08',
  booking: 'https://bookon.ua/m.beauty.one',
  instagram: 'https://www.instagram.com/m.beauty.one/',
  direct: 'https://ig.me/m/m.beauty.one',
  threads: 'https://www.threads.net/@m.beauty.one',
  maps: 'https://www.google.com/maps/search/?api=1&query=M+Beauty+One+%D0%9B%D1%8C%D0%B2%D1%96%D0%B2+%D0%BF%D0%BB.+%D0%84%D0%B2%D0%B3%D0%B5%D0%BD%D0%B0+%D0%9C%D0%B0%D0%BB%D0%B0%D0%BD%D1%8E%D0%BA%D0%B0+4',
  route: 'https://www.google.com/maps/dir/?api=1&destination=M+Beauty+One+%D0%9B%D1%8C%D0%B2%D1%96%D0%B2+%D0%BF%D0%BB.+%D0%84%D0%B2%D0%B3%D0%B5%D0%BD%D0%B0+%D0%9C%D0%B0%D0%BB%D0%B0%D0%BD%D1%8E%D0%BA%D0%B0+4',
  rating: '5,0',
  reviewsCount: 183,
  hours: [
    { days: 'Понеділок–субота', short: 'пн–сб', time: '10:00–19:00' },
    { days: 'Неділя', short: 'нд', time: '09:00–16:00' },
  ],
  pricesDate: '21 листопада 2026 року',
};

/** 1700 -> «1 700 ₴» з нерозривними пробілами */
export const uah = (n: number | string) =>
  typeof n === 'number' ? `${n.toLocaleString('uk-UA').replace(/\s/g, ' ')} ₴` : n;

// Підшлях деплою без слеша в кінці: '/M-beauty-one' на GitHub Pages, '' з кореня.
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
