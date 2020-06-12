import { AccountKind, Gender } from "./enums";
import { HeaderApp } from "./header";

export interface AccountFields {
  ftcId: string;
  unionId: string;
  email: string;
  oldPassword: string;
  password: string;
  confirmPassword: string;
  token: string;
  sourceUrl: string;
  appHeaders: HeaderApp;
}

export interface PasswordField {
  password: string;
}

// Credentials is used both for login form and request data to sign in or sign up.
export type Credentials = Pick<AccountFields, "email" | "password">;

export type SignUpForm = Pick<AccountFields, "email" | "password" | "confirmPassword">;

// EmailForm is used for forms with email field only.
export type EmailForm = Pick<AccountFields, "email">;

// PasswordResetForm is used when user is trying to reset password after verified password reset token.
export type PasswordResetForm = Pick<AccountFields, "password" | "confirmPassword">;

// Form data when user wants to change password.
export type PasswordsFormData = Pick<AccountFields, "oldPassword" | "password" | "confirmPassword">;

export interface NameForm {
  userName: string;
}

export interface MobileForm {
  mobile: string;
}

export interface ProfileFormData {
  familyName?: string;
  givenName?: string;
  gender?: Gender;
  birthday?: string;
}

export interface LinkingFormData {
  targetId: string;
}

export interface UnlinkFormData {
  anchor?: AccountKind;
}
