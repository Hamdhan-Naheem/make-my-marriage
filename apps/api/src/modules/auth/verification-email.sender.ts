export type SendVerificationEmailInput = {
  email: string;
  firstName: string;
  rawToken: string;
};

export interface VerificationEmailSender {
  send(input: SendVerificationEmailInput): Promise<void>;
}
