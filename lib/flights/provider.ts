import type { Contact, Passenger } from './types';

export interface SearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  maxStops?: number;
  sort?: 'price' | 'duration';
}

export interface ProviderOffer {
  id: string;
  price: { amount: number; currency: string };
  summary: string;
  raw: any;
}

export interface BookingInput {
  offerId: string;
  contact: Contact;
  passengers: Passenger[];
}

export interface BookingResult {
  orderId: string;
  status: 'RESERVED' | 'CONFIRMED';
  raw: any;
}

export interface FlightsProvider {
  search(params: SearchParams): Promise<ProviderOffer[]>;
  getOffer(offerId: string): Promise<ProviderOffer | null>;
  hold?(offerId: string, minutes: number): Promise<{ holdId: string; expiresAt: string }>;
  book(input: BookingInput): Promise<BookingResult>;
  cancel(orderId: string, reason?: string): Promise<{ status: 'CANCELLED' }>;
  getOrder(orderId: string): Promise<any>;
}

