/**
 * Auth Service
 * Business logic for authentication operations
 */

import { IUserRepository } from '@/lib/domain/interfaces/IUserRepository';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '@/lib/errors';
import { AUTH_CONSTANTS } from '@/lib/config/constants';
import { getUserRepository } from '@/lib/repositories/user-repository';

export interface RegisterUserData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Register a new user
   */
  async registerUser(data: RegisterUserData): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(credentials: LoginCredentials): Promise<User | null> {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.verifyPassword(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Get user by email with memberships
   */
  async getUserByEmailWithMemberships(email: string) {
    return this.userRepository.findByEmailWithMemberships(email);
  }
}

// Factory function for dependency injection
export function createAuthService(userRepository?: IUserRepository): AuthService {
  return new AuthService(userRepository || getUserRepository());
}


