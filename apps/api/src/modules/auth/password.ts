import * as argon2 from "argon2";

const ARGON2_MEMORY_COST_KIB = 19 * 1024;
const ARGON2_TIME_COST = 2;
const ARGON2_PARALLELISM = 1;

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export const argon2PasswordHasher: PasswordHasher = {
  hash(password) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: ARGON2_MEMORY_COST_KIB,
      timeCost: ARGON2_TIME_COST,
      parallelism: ARGON2_PARALLELISM,
    });
  },
  verify(hash, password) {
    return argon2.verify(hash, password);
  },
};
