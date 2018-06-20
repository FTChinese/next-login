const baseUrl = "http://localhost:8000";
const passwordReset = `${baseUrl}/users/password-reset`;

module.exports = {
  createAccount: `${baseUrl}/users/new`,
  verifyEmail: `${baseUrl}/users/verify`,
  login: `${baseUrl}/users/auth`,
  resetLetter: `${passwordReset}/letter`,
  verifyResetToken: `${passwordReset}/tokens`,
  passwordReset,
};