import { db } from './prisma';

export const users = {
  async getProfile(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    return user ?? (await db.user.create({ data: { id: userId, email: `${userId}@example.dev` } }));
  },

  async updateProfile(userId: string, args: { name?: string; email?: string; phone?: string }) {
    return db.user.update({ where: { id: userId }, data: { name: args.name, email: args.email } });
  },

  async addTraveler(userId: string, traveler: any) {
    return db.traveler.create({
      data: {
        userId,
        firstName: traveler.firstName,
        lastName: traveler.lastName,
        gender: traveler.gender ?? null,
        dob: traveler.dob ? new Date(traveler.dob) : null,
        docType: traveler.docType ?? null,
        docNumber: traveler.docNumber ?? null,
        docExpiry: traveler.docExpiry ? new Date(traveler.docExpiry) : null,
      },
    });
  },
};

