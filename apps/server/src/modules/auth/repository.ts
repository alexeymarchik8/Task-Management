import { prisma } from '../../db/prisma.js';
import type { User } from '../../generated/prisma/index.js';

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function createUser(email: string, hashedPassword: string): Promise<User> {
  return prisma.user.create({ data: { email, password: hashedPassword } });
}
