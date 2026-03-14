import type { IWelcomeEmailSender } from "./IWelcomeEmailSender.js";
import type { IPasswordResetEmailSender } from "./IPasswordResetEmailSender.js";
import type { IPasswordChangedEmailSender } from "./IPasswordChangedEmailSender.js";

/** Combined adapter interface. Implementations can implement both (ISP: callers use the smaller interfaces). */
export interface IEmailSender extends IWelcomeEmailSender, IPasswordResetEmailSender, IPasswordChangedEmailSender {}
export type { WelcomeEmailParams } from "./IWelcomeEmailSender.js";
export type { PasswordResetEmailParams } from "./IPasswordResetEmailSender.js";
export type { PasswordChangedEmailParams } from "./IPasswordChangedEmailSender.js";
