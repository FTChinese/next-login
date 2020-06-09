import { AccountKind } from "./enums";
import { Credentials } from "./request-data";

export type SignUpForm = Credentials & {
  confirmPassword: string;
}

export interface NameForm {
  userName: string;
}

export interface MobileForm {
  mobile: string;
}

export interface ProfileFormData {
  familyName?: string;
  givenName?: string;
  gender?: string;
  birthday?: string;
}

export interface Passwords {
  oldPassword: string;
  newPassword: string;
}

// Data converted from `IPwResetFormData` and passed to API


export interface PasswordsFormData {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

// Form data for requesting password reset token,
// or change email.
export interface EmailData {
  email: string;
}

export interface LinkingFormData {
  targetId: string;
}

export interface UnlinkFormData {
  anchor?: AccountKind;
}
