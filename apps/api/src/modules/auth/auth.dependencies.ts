import { PrismaAuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { argon2PasswordHasher } from "./password.js";

export const authService = new AuthService(new PrismaAuthRepository(), argon2PasswordHasher);
