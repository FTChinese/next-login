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
export interface PasswordResetter {
  token: string;
  password: string;
}

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

export type PwResetLetter = EmailData & {
  sourceUrl: string;
}
