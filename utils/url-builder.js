const qs = require('querystring');
const {URL, URLSearchParams} = require('url');
const _ = require('lodash');

/**
 * @param {string} base - base url
 * @param {Object?} params
 * @param {Object?} hash
 * @return {string}
 */
function buildUrl ({base, params, hash}={}) {
  const newUrl = new URL(base);
  if (params) {
    newUrl.search = qs.stringify(params);
  }

  if (hash) {
    newUrl.hash = stringify(hash);
  }

  return newUrl.toString();
}

class UrlBuilder {
  constructor(base='') {
    if (!_.isString(base) || base === '') {
      throw new TypeError('Base url must be a string');
    }
    this._base = base;
    this._params = {};
    this._hash = '';
  }

  query(obj={}) {
    Object.assign(this._params, obj);
    return this;
  }

  hash(str='') {
    this._hash = str;
    return this;
  }

  toString() {
    const newUrl = new URL(this._base);
    if (!_.isEmpty(this._params)) {
      newUrl.search = qs.stringify(this._params);
    }

    if (!_.isEmpty(this._hash)) {
      newUrl.hash = encodeURIComponent(this._hash);
    }

    return newUrl.toString();
  }
}

module.exports = UrlBuilder;
