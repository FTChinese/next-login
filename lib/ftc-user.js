const request = require("superagent");
const debug = require("debug")("user:ftc-user");

const {
  nextApi,
} = require("./endpoints");

const {
  KEY_USER_ID,
} = require("./request")

/**
 * @description FtcUser wraps an FTC account's user id.
 * This is used to retrieve FTC account-only data.
 */
class FtcUser {
  /**
   * @param {string} id 
   */
  constructor(id) {
    this.userId = id;
  }

  /**
   * @description Fetch a user's ftc account.
   * @returns {Promise<IAccount>}
   */
  async fetchAccount() {
    const resp = await request
      .get(nextApi.account)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  /**
   * @returns {Promise<IProfile>}
   */
  async fetchProfile() {
    const resp = await request
      .get(nextApi.profile)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  /**
   * @param {Object} data
   * @param {string} data.userName
   * @returns {Promise<void>}
   */
  updateDisplayName(data) {
    return request
      .patch(nextApi.name)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * 
   * @param {Object} data 
   * @param {string} data.mobile
   * @return {Promise<void>}
   */
  updateMobile(data) {
    return request
      .patch(nextApi.mobile)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data 
   * @param {string} data.familyName
   * @param {string} data.givenName
   * @param {string} data.gender
   * @param {string} data.birthday
   * @returns {Promise<void>}
   */
  updatePersonalInfo(data) {
    return request
      .patch(nextApi.profile)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data
   * @param {string} data.email
   * @returns {Promise<void>}
   */
  updateEmail(data) {
    return request.patch(nextApi.email)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} data 
   * @param {string} data.oldPassword
   * @param {string} data.newPassword
   * @returns {Promise<void>}
   */
  updatePassword(data) {
    return request.patch(nextApi.password)
      .set(KEY_USER_ID, this.userId)
      .send(data);
  }

  /**
   * @param {Object} clientApp 
   */
  requestVerificationLetter(clientApp) {
    return request
      .post(nextApi.requestVerification)
      .set(clientApp)
      .set(KEY_USER_ID, this.userId)
  }

  /**
   * @returns {Promise<IAddress>}
   */
  async fetchAddress() {
    const resp = await request
      .get(nextApi.address)
      .set(KEY_USER_ID, this.userId);

    return resp.body;
  }

  /**
   * @param {IAddress} address 
   */
  async updateAddress(address) {
    return request.patch(nextApi.address)
      .set(KEY_USER_ID, this.userId)
      .send(address);
  }

  /**
   * @param {Object} paging
   * @param {number} paging.page
   * @param {number} paging.per_page
   * @returns {Promise<void>}
   */
  async starredArticles(paging) {
    const resp = await request
      .get(nextApi.starred)
      .set(KEY_USER_ID, this.userId)
      .query(paging);

    return resp.body;
  }

  /**
   * @param {string} articleId 
   * @returns {Promise<void>}
   */
  unstarArticle(articleId) {
    return request
      .delete(`${nextApi.starred}/${articleId}`)
      .set(KEY_USER_ID, this.userId);
  }
}

module.exports = FtcUser;
