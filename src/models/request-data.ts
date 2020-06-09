import { EmailData } from "./form-data";

export interface RequestLocation {
  sourceUrl: string;
}

export type PwResetLetter = EmailData & RequestLocation;

export interface PasswordResetter {
  token: string;
  password: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Passwords {
  oldPassword: string;
  password: string;
}
