/**
 * User model — domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
  emailVerifiedAt: Date | null;
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

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string | null {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
