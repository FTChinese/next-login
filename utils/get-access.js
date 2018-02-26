const debug = require('debug')('login:access-data');
const got = require('got');
const loadJsonFile = require('load-json-file');
const writeJsonFile = require('write-json-file');
const {resolve} = require('path');

const endpoint = process.env.OAUTH_ENDPOINT_TOKEN || 'http://localhost:9001/token';
const clientId = process.env.N_LOGIN_CLIENT_ID || '1acc31b7db001aa88302';
const clientSecret = process.env.N_LOGIN_CLIENT_SECRET || 'b367d4adfb20d21c5969e78e2318edd3a7b77ecabcf32f971ae77a55aaac7181';

/**
 * @param {boolean} fromFile - try to load from file system if true. If the file exists, it returns; otherwise it will request to oauth endpoint.
 * @return {Object | null}
 * @type {Object} accessData
 * @property {string} access_token
 * @property {number} expires_in
 * @property {string} token_type = "Bearer"
 */
module.exports = async function(fromFile=false) {

  const accessFile = resolve(__dirname, `../.tmp/access.json`);
  if (fromFile) {
    debug('Load previsouly saved access token from file system')
    try {
      const accessData = await loadJsonFile(accessFile);

      if (accessData && accessData.access_token) {
        debug('Load access data from file sytem ok')
        return accessData;
      }
    } catch(e) {
      debug('Error loading access token from file: %o', e)
    }
  }

  debug('Request access token to oauth server');
  const resp = await got.post(endpoint, {
    form: true,
    json: true,
    auth: `${clientId}:${clientSecret}`,
    body: {
      grant_type: 'client_credentials',
    }
  });

  if (resp.statusCode > 300) {
    debug('Access token response status code: %d', resp.statusCode)
    return null;
  }
  const accessData = resp.body;

  try {
    await writeJsonFile(accessFile, accessData);
  } catch(e) {
    debug("Save access data error: %o", e);
  }

  // osin respond 200 even when it returns error message. Example:
  /**
{
	"error": "invalid_grant",
	"error_description": "The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client."
}
   */
  if (accessData.error) {
    debug('Access data has error: %O', accessData);
    return null;
  }

  debug('Get access token data');
  return accessData;
}