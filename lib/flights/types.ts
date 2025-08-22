import { z } from 'zod';

/**
 * Contact details for the booking holder.
 */
export interface Contact {
  email: string;
  phone?: string;
}

export const ContactSchema: z.ZodType<Contact> = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
});

/**
 * Passenger information for each traveler in a booking.
 */
export interface Passenger {
  type: 'ADULT' | 'CHILD' | 'INFANT';
  firstName: string;
  lastName: string;
}

export const PassengerSchema: z.ZodType<Passenger> = z.object({
  type: z.enum(['ADULT', 'CHILD', 'INFANT']),
  firstName: z.string(),
  lastName: z.string(),
});

