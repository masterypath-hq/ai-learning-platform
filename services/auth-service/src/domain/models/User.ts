/**
 * User model — domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export type AuthProvider = "local" | "google";
export type PlanTier = "free" | "pro" | "institution";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  planTier: PlanTier;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  authProvider: AuthProvider;
  googleId: string | null;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string | null {
    return this.props.passwordHash;
  }

  get name(): string | null {
    return this.props.name;
  }

  get planTier(): PlanTier {
    return this.props.planTier;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }

  get authProvider(): AuthProvider {
    return this.props.authProvider;
  }

  get googleId(): string | null {
    return this.props.googleId;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
