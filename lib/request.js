const request = require("superagent");
const debug = require("debug")("user:account");

const {
  nextApi,
} = require("./endpoints");

exports.KEY_USER_ID = "X-User-Id";
exports.KEY_UNION_ID = "X-Union-Id";
exports.KEY_APP_ID = "X-App-Id";

class ForgotPassword {
  /**
   * 
   * @param {string} email
   * @returns {Promise<void>}
   */
  static sendResetLetter(email, clientApp) {
    return request
      .post(nextApi.passwordResetLetter)
      .set(clientApp)
      .send({ email });
  }

  /**
   * @param {string} token 
   * @returns {Promise<string>}
   */
  static async verifyToken(token) {
    const resp = await request
      .get(nextApi.passwordResetToken(token));

    /**
     * @type {{email: string}}
     */
    const body = resp.body;
    return body.email;
  }

  static reset(token, password) {
    return request
      .post(nextApi.resetPassword)
      .send({
        token,
        password,
      });
  }
}

class Verification {
  constructor(token) {
    this.token = token;
  }

  /**
   * @returns {Promise<void>}
   */
  email() {
    return request
      .put(nextApi.verifyEmail(this.token));
  }
}

exports.ForgotPassword = ForgotPassword;
exports.Verification = Verification;
