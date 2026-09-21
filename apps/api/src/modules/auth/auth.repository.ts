import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/database.js";
import { EmailAlreadyRegisteredError } from "../../shared/errors.js";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

export interface AuthUserRecord {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
}

export interface SessionWithUserRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  refreshTokenVersion: number;
  lastRotatedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  user: Omit<AuthUserRecord, "passwordHash">;
}

export interface CreateSessionData {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
}

export interface AuthRepository {
  findUserIdByEmail(email: string): Promise<string | null>;
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  createUnverifiedUser(data: CreateUserData): Promise<void>;
  createSession(data: CreateSessionData): Promise<void>;
  findSessionWithUser(sessionId: string): Promise<SessionWithUserRecord | null>;
  rotateRefreshToken(input: {
    sessionId: string;
    userId: string;
    currentHash: string;
    currentVersion: number;
    nextHash: string;
    rotatedAt: Date;
  }): Promise<boolean>;
  revokeSession(sessionId: string): Promise<void>;
}

export class PrismaAuthRepository implements AuthRepository {
  async findUserIdByEmail(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user?.id ?? null;
  }

  async createUnverifiedUser(data: CreateUserData): Promise<void> {
    try {
      await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash: data.passwordHash,
          emailVerifiedAt: null,
        },
        select: { id: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        emailVerifiedAt: true,
      },
    });
  }

  async createSession(data: CreateSessionData): Promise<void> {
    await prisma.session.create({
      data: {
        id: data.id,
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        refreshTokenVersion: 1,
        lastRotatedAt: new Date(),
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
      },
      select: { id: true },
    });
  }

  async findSessionWithUser(sessionId: string): Promise<SessionWithUserRecord | null> {
    return prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        refreshTokenVersion: true,
        lastRotatedAt: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailVerifiedAt: true,
          },
        },
      },
    });
  }

  async rotateRefreshToken(input: {
    sessionId: string;
    userId: string;
    currentHash: string;
    currentVersion: number;
    nextHash: string;
    rotatedAt: Date;
  }): Promise<boolean> {
    const result = await prisma.session.updateMany({
      where: {
        id: input.sessionId,
        userId: input.userId,
        refreshTokenHash: input.currentHash,
        refreshTokenVersion: input.currentVersion,
        revokedAt: null,
        expiresAt: { gt: input.rotatedAt },
      },
      data: {
        refreshTokenHash: input.nextHash,
        refreshTokenVersion: { increment: 1 },
        lastRotatedAt: input.rotatedAt,
      },
    });

    return result.count === 1;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
