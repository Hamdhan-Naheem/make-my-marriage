import { ResendVerificationEmailSender } from "../../integrations/resend-verification-email.sender.js";
import { PrismaAuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { argon2PasswordHasher } from "./password.js";
import type { VerificationEmailSender } from "./verification-email.sender.js";

const resendVerificationEmailSender = new ResendVerificationEmailSender();
let activeVerificationEmailSender: VerificationEmailSender = resendVerificationEmailSender;

const delegatedVerificationEmailSender: VerificationEmailSender = {
  send(input) {
    return activeVerificationEmailSender.send(input);
  },
};

export const authService = new AuthService(
  new PrismaAuthRepository(),
  argon2PasswordHasher,
  delegatedVerificationEmailSender,
);

export function setVerificationEmailSenderForTests(sender: VerificationEmailSender): () => void {
  activeVerificationEmailSender = sender;
  return () => {
    activeVerificationEmailSender = resendVerificationEmailSender;
  };
}
