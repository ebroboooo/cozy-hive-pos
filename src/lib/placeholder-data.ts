import type { Item, Settings } from './types';

export const placeholderItems: Omit<Item, 'id'>[] = [
  { name: 'Coffee', price: 30 },
  { name: 'Tea', price: 25 },
  { name: 'Snack', price: 40 },
  { name: 'Printing', price: 5 }
];

export const defaultSettings: Settings = {
  hourlyRate: 25,
  currency: 'EGP',
  theme: "white",
  autoLogoutHours: 10,
  enableArabic: false,
};
