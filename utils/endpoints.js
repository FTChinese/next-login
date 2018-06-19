const baseUrl = "http://localhost:8000";

module.exports = {
  createAccount: `${baseUrl}/users/new`,
  verifyEmail: `${baseUrl}/users/verify`,
};