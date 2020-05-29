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

export interface IPasswords {
  oldPassword: string;
  newPassword: string;
}

// Data converted from `IPwResetFormData` and passed to API
export interface IPasswordReset {
  token: string;
  password: string;
}

// Form data for requesting password reset token,
// or change email.
export interface EmailData {
  email: string;
}
