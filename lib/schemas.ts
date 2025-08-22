import { z } from 'zod';

export const ListBookingsSchema = z.object({
  status: z.enum(['RESERVED', 'CONFIRMED', 'CANCELLED']).optional(),
  cursor: z.string().optional(),
});
