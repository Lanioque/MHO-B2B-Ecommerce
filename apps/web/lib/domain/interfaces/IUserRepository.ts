/**
 * User Repository Interface
 */

import { User, Membership } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  name?: string | null;
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user with memberships
   */
  findByEmailWithMemberships(
    email: string
  ): Promise<(User & { memberships: Membership[] }) | null>;

  /**
   * Create user
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Update user
   */
  update(id: string, data: Partial<CreateUserData>): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;
}


