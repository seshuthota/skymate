import { db } from './prisma';
import { provider } from './flights';

type CreateArgs = {
  offerId: string;
  contact: any;
  passengers: any[];
};

export const bookings = {
  async create(userId: string, args: CreateArgs) {
    const offer = await provider.getOffer(args.offerId);
    if (!offer) throw new Error('Offer not found');

    const res = await provider.book({ offerId: args.offerId, contact: args.contact, passengers: args.passengers });
    // In prototype, simulate 1 segment based on offer summary/raw
    const now = new Date();
    return await db.$transaction(async (tx) => {
      // ensure user exists
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email: `${userId}@example.dev` },
      });
      const booking = await tx.booking.create({
        data: {
          userId,
          provider: process.env.PROVIDER ?? 'mock',
          providerRef: res.orderId,
          status: res.status,
          totalAmount: offer.price.amount,
          currency: offer.price.currency,
          offerId: offer.id,
          passengers: args.passengers as any,
          contact: args.contact as any,
        },
      });
      await tx.segment.create({
        data: {
          bookingId: booking.id,
          origin: (offer.raw?.origin as string) || 'BLR',
          destination: (offer.raw?.destination as string) || 'BOM',
          departAt: new Date(offer.raw?.depart || now.toISOString()),
          arriveAt: new Date(new Date(offer.raw?.depart || now.toISOString()).getTime() + 90 * 60 * 1000),
          carrier: offer.raw?.carrier || 'XX',
          number: offer.raw?.number || '0001',
        },
      });
      return booking;
    });
  },

  async cancel(userId: string, bookingId: string, reason?: string) {
    const booking = await db.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new Error('Booking not found');
    await provider.cancel(booking.providerRef, reason);
    return await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
  },

  async get(userId: string, bookingId: string) {
    const booking = await db.booking.findFirst({ where: { id: bookingId, userId }, include: { segments: true } });
    if (!booking) throw new Error('Booking not found');
    return booking;
  },

  async update(userId: string, bookingId: string, patch: { contact?: any; passengers?: any[] }) {
    const booking = await db.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'CANCELLED') throw new Error('Cannot update a cancelled booking');
    return db.booking.update({
      where: { id: booking.id },
      data: {
        contact: typeof patch.contact !== 'undefined' ? (patch.contact as any) : undefined,
        passengers: typeof patch.passengers !== 'undefined' ? (patch.passengers as any) : undefined,
      },
      include: { segments: true },
    });
  },

  async list(userId: string, status?: string, cursor?: string) {
    const take = 10;
    const where: any = { userId };
    if (status) where.status = status;
    const items = await db.booking.findMany({
      where,
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { segments: true },
    });
    const nextCursor = items.length > take ? items[take].id : null;
    return { items: items.slice(0, take), nextCursor };
  },
};
