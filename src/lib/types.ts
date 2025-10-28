
import type { Timestamp } from 'firebase/firestore';

export type SessionItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

// The client-side Session type uses Firestore's Timestamp
export type Session = {
  id: string;
  name: string;
  entryTime: Timestamp;
  exitTime: Timestamp | null;
  status: 'active' | 'completed' | 'cancelled';
  items: SessionItem[];
  totalCost?: number;
  discount?: number;
  finalAmount?: number;
  paymentMethod?: 'cash' | 'instapay';
  durationMinutes?: number;
};

export type Item = {
  id:string;
  name: string;
  price: number;
};

export type Settings = {
  hourlyRate: number;
  currency: string;
  theme: string;
  autoLogoutHours: number;
  enableArabic: boolean;
};

export type UserProfile = {
  uid: string;
  email: string;
  createdAt: Timestamp;
  role: 'admin' | 'cashier';
};
