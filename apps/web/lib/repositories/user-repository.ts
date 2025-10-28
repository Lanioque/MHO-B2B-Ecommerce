/**
 * User Repository Implementation
 */

import { User, Membership, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  IUserRepository,
  CreateUserData,
} from '@/lib/domain/interfaces/IUserRepository';

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findByEmailWithMemberships(
    email: string
  ): Promise<(User & { memberships: Membership[] }) | null> {
    return this.db.user.findUnique({
      where: { email },
      include: {
        memberships: true,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateUserData>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }
}

// Singleton instance
let userRepositoryInstance: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}


