import { AccountFields } from "./form-data";

// Send the site base url and email to API when requesting password reset letter.
export type PwResetLetter = Pick<AccountFields, "email" | "sourceUrl">;

export type PasswordResetter = Pick<AccountFields, "password" | "token">;

export type PasswordUpdater = Pick<AccountFields, "oldPassword" | "password">;
